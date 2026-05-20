# Development plan

> **For a new session:** read this file end-to-end before touching code. It is the source of truth for phase status, decisions already made, and what's next. Update it whenever a phase merges or a decision is taken — drift between this file and reality is the failure mode to avoid. CLAUDE.md links here.

## Approach: backend-first, contract-driven

Build the backend first — auth, Stripe webhooks, RLS, and transactional stock decrements are the risky parts. Frontend is well-trodden ground (Next.js + TanStack Query).

**Contract discipline:** lock DTOs in `packages/types/src` before each backend phase so the frontend can be built against stable contracts, and a drift breaks both apps at build time.

---

## Phases

### ✅ Phase 0 — Foundation
- pnpm workspaces + Turborepo (build / dev / lint / typecheck pipelines)
- `packages/config`: shared `tsconfig.base.json` + eslint base
- `packages/database`: Prisma schema — `User`, `Product`, `Category`, `Order`, `OrderItem` + `Role` / `OrderStatus` enums
- `packages/types`: shared DTOs (Product, Order, Auth)
- `apps/api`: Express skeleton with helmet, cors, rate-limiter on `/auth`; `lib/prisma.ts` singleton; `lib/jwt.ts`; `lib/env.ts` (Zod-validated, fails fast on boot)
- `apps/frontend`: Next.js 15 scaffold (App Router, TS, Tailwind v4, src/)
- Security: Husky + gitleaks pre-commit, gitleaks GitHub Action, Dependabot, MIT LICENSE, branch protection ruleset (require PR, 0 reviews, no force-push/delete, linear history)
- **Merged:** PR #1

### ✅ Phase 0.5 — Database & security baseline
- Supabase project connected via MCP
- Initial schema migration applied (`User`, `Category`, `Product`, `Order`, `OrderItem` with enums, indexes, FK constraints, `updatedAt` triggers)
- Row Level Security enabled on all 5 tables; API uses service role (bypasses RLS), anon key blocked
- `packages/database` scripts wired with `dotenv-cli` to load env from `apps/api/.env`
- `apps/frontend/.env.example` added; frontend `.gitignore` fixed to allow `.env.example`
- **Merged:** PR #13

### ✅ Phase 1 — Auth & users (Clerk + backend integration)
- **Identity provider: Clerk.** Handles email/password signup, Google OAuth (and other social providers toggleable in the Clerk dashboard), session management, password reset, email verification. The frontend UI for this lands in Phase 5; Phase 1 covers the backend integration only.
- Schema change: `User.passwordHash` removed; `User.clerkUserId String @unique` added. `User.id` stays as `cuid()` so existing FKs (`Order.userId`, etc.) are unchanged.
- Backend deps: add `@clerk/backend`; remove `bcrypt` and `jsonwebtoken`.
- Backend env: add `CLERK_SECRET_KEY`; remove `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`. Drop `apps/api/src/lib/jwt.ts`.
- New `apps/api/src/lib/clerk.ts` — wraps `@clerk/backend` for token verification and user lookup.
- `requireAuth` middleware: extracts `Authorization: Bearer <clerk_session_token>`, verifies via Clerk, looks up the local `User` by `clerkUserId`, lazy-creates the row on first sight (upsert), attaches `req.user` with the local row (not the JWT payload — the local row is the source of truth for `role`).
- `requireRole('ADMIN')` middleware unchanged.
- Endpoints: only `GET /auth/me` (returns local `UserDTO`). `POST /auth/register | /login | /refresh` are gone — Clerk owns all of that.
- **Decision — user provisioning:** lazy upsert on first authenticated API call. Middleware fetches the Clerk user (email, name) via `@clerk/backend` when no local row exists yet, then inserts. Trade-off: cold-start cost of one Clerk API call per new user, against the simplicity of not maintaining a webhook surface in Phase 1. Webhook (`user.created`) is deferred to Phase 9 if pre-provisioning, welcome emails, or signup analytics become priorities.
- **Decision — local `User` shape:** keep `User.id` as `cuid()`; add `clerkUserId String @unique`. `email` and `name` are denormalized from Clerk **at creation time only** — they do not resync on every request (that would cost a Clerk API call per request). Drift after creation is tolerated until the `user.updated` webhook is wired in Phase 9. `role` is authoritative in our DB, not in Clerk metadata — keeps role assignment fully under our control and out of any client-mutable surface.
- **Decision — token transport:** `Authorization: Bearer <clerk_session_token>`. Frontend obtains via Clerk SDK (`auth().getToken()` server-side or `useAuth().getToken()` client-side). No refresh logic in the API — Clerk SDK handles token refresh transparently.
- **Decision — error response shape:** unchanged from earlier draft. All errors return `{ error: { code, message, details? } }` with `ApiErrorCode` from `packages/types/src/errors.ts` (e.g. `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`). The auth-specific codes (`EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`) are removed — Clerk handles those flows.
- **Reuse:** `lib/prisma.ts`, `lib/api-error.ts`, `middlewares/errorHandler.ts`, `middlewares/requireRole.ts`, `packages/types/src/errors.ts`, `UserDTO` and `Role` from `packages/types/src/auth.ts`.
- **Removed types** (`packages/types/src/auth.ts`): `RegisterDTO`, `LoginDTO`, `AuthResponseDTO`, `AuthTokensDTO`, `JwtPayload`. **Kept:** `Role`, `UserDTO`.
- **Out-of-code work (the user does this in the Clerk dashboard):** create the Clerk application, enable email/password + Google OAuth, copy the `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` into `.env` files.
- **Exit criteria:**
  - With a valid Clerk session token: `GET /auth/me` returns the local `UserDTO` (and creates the row on first call, including `email` and `name` synced from Clerk).
  - Without a token or with an invalid one: `GET /auth/me` returns `401 UNAUTHORIZED`.
  - A second call with the same Clerk user reuses the existing local row (no duplicate insert; the `clerkUserId` unique index makes this deterministic).
- **Merged:** PR #14

### ✅ Phase 2 — Catalog (backend)
- Admin CRUD for categories and products; public read endpoints
- Pagination, filter by category, search by name / slug (Postgres `ILIKE` is sufficient at MVP scale; revisit with `pg_trgm` or full-text if catalog grows past ~10k products)
- Seed script in `packages/database/` with sample products (Faker.js)
- **Reuse:** `ProductDTO`, `CategoryDTO`, `CreateProductDTO` from `packages/types/src/product.ts`
- **Decision — soft delete:** `Product.isActive Boolean @default(true)`. Public reads filter `isActive: true`; admin `GET /products/admin/all` returns all. `DELETE` sets `isActive: false`; idempotent if already inactive. Preserves FK integrity with `OrderItem.productId`.
- **Decision — slug strategy:** slug required in request body for both products and categories. Zod validates kebab-case format (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`). Slug uniqueness violations (Prisma `P2002`) map to `409 CONFLICT`.
- **Decision — category filter:** `?category=<slug>` (not `categoryId`). URL-friendly, consumable directly from Next.js SSR route params.
- **Decision — new error code `CONFLICT`:** added to `ApiErrorCode` in `packages/types/src/errors.ts`. Used for slug duplicates and FK violations (category with products).
- **Decision — `Paginated<T>` envelope:** new `packages/types/src/pagination.ts` with `{ data, page, pageSize, total }`. Used by both product list endpoints.
- **Exit criteria:** `GET /products?category=X&page=1` returns paginated seeded data
- **Merged:** PR #17

### ✅ Phase 3 — Orders (backend, no payments yet)
- `POST /orders` — create order + items and decrement stock atomically
- `GET /orders` (own) and `GET /orders/:id`
- Admin: `PATCH /orders/:id/status`
- **Decision — concurrent stock decrement:** use a conditional UPDATE per item inside the transaction:
  ```sql
  UPDATE "Product" SET stock = stock - $qty WHERE id = $id AND stock >= $qty
  ```
  If `rowsAffected === 0` for any item, abort the transaction and return `409 Conflict`. This is atomic at the row level (no `FOR UPDATE`, no serializable isolation, no retry loop) and is the simplest correct option. Prisma's default `ReadCommitted` isolation is fine with this pattern.
- **Decision — order idempotency:** `POST /orders` accepts an `Idempotency-Key` header. Define the contract now (in `packages/types` and the OpenAPI-ish notes) even though the table to back it lands with the implementation. Same key + same body within 24h → return the original order; same key + different body → `422`. Backed by an `IdempotencyKey { key String @id; orderId String; requestHash String; createdAt DateTime }` table (add to the Phase 3 migration).
- **Reuse:** `OrderDTO`, `CreateOrderDTO`, `OrderStatus` from `packages/types/src/order.ts`
- **Exit criteria:**
  - Order placed end-to-end with status `PENDING`; stock decrements
  - Concurrent oversells: a load test of N parallel requests for a product with stock=1 results in exactly 1 success and N-1 `409`s
  - Replaying `POST /orders` with the same `Idempotency-Key` returns the same order, does not create a duplicate
- **Merged:** PR #18

### ⏭️ Phase 4 — Stripe integration (backend) ← deferred
- Create `PaymentIntent` on order placement, return `clientSecret`
- `POST /webhooks/stripe` — signature verification, then idempotent handler keyed on `event.id`
- Order status transitions: `PENDING → PAID` / `CANCELLED`
- **Decision — webhook idempotency storage:** add a `WebhookEvent { id String @id; type String; processedAt DateTime @default(now()) }` table in the Phase 4 migration. Handler does `INSERT ... ON CONFLICT DO NOTHING`; if the insert is a no-op, the event was already processed and the handler returns 200 without side effects. Keying on `event.id` (Stripe's own ID) makes this robust to Stripe's at-least-once delivery.
- **Exit criteria:**
  - Stripe CLI replay flips order to `PAID`
  - Duplicate webhook (same `event.id`) is a no-op — verified by replaying the same event twice and confirming no double-write
  - Invalid signature → 400, no DB write
- **Decision — deferred:** omitted for the demo. The order flow works end-to-end without payment; orders stay in `PENDING`. Can be added later without breaking any existing contract.

### ✅ Phase 5 — Frontend foundation
- **Clerk integration via `@clerk/nextjs`**: `<ClerkProvider />` at the root (inside `Providers` client component), `clerkMiddleware` with `createRouteMatcher` for allowlist-based protection, `<SignIn />` / `<SignUp />` pages under `/sign-in` and `/sign-up`.
- Typed HTTP layer in `apps/frontend/src/services/` (api-client, auth, products) using `@ecommerce/types`; `apiFetch<T>` accepts an optional token and normalizes `ApiErrorBody` into a typed `ApiClientError`.
- TanStack Query provider co-located with `ClerkProvider` in a `Providers` client component. Default options: `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1`.
- App shell (utility bar, navbar, footer) styled with the Storely design tokens from `.docs/`. Tokens defined in `globals.css` via `@theme inline` (Tailwind v4 — no `tailwind.config.ts`).
- Home page is a server component that calls `GET /products?pageSize=8` and renders a 4-col grid of `ProductCardSkeleton`. `/account` is a client component using TanStack Query → `GET /auth/me` with a token from `useAuth().getToken()` — validates the full auth flow end-to-end.
- Error boundary (`app/error.tsx`) + 404 (`app/not-found.tsx`).
- **Decision — allowlist route protection:** `clerkMiddleware` protects only `/account(.*)`, `/orders(.*)`, `/checkout(.*)`, `/admin(.*)`. Everything else (home, catalog, sign-in/up) is public. Denylist would force every catalog browse through Clerk middleware unnecessarily.
- **Decision — single `apiFetch` for SSR + CSR:** one function with an optional `token` param works in both contexts. Server components pass `await (await auth()).getToken()` directly; client components inject the token inside the `queryFn` via `useAuth()`. Avoids two parallel client implementations.
- **Decision — Clerk v7 API:** `<SignedIn>`/`<SignedOut>` were removed in v7 in favor of async `<Show when="...">` (server) or `useUser()` (client). Navbar uses `useUser()` and is a client component; the rest of the shell stays server-rendered.
- **Decision — fonts:** Montserrat (headings) + Lato (body) via `next/font/google`. Mapped to `--font-heading` / `--font-body` in `globals.css`. Replaces the Geist defaults from the scaffold.
- **Decision — no SSR prefetch for TanStack Query yet:** Phase 5's home uses direct `fetch` in a server component. Hydration boundaries for the catalog land in Phase 6 when product list / detail need full SSR for SEO.
- **Removed:** NextAuth v5, custom refresh logic, 401-refresh queue. Clerk SDK handles token refresh transparently.
- **Out-of-code work (the user):** copy `apps/frontend/.env.example` to `apps/frontend/.env.local` and fill `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL`. Ensure `FRONTEND_URL=http://localhost:3000` in `apps/api/.env` for CORS.
- **Exit criteria:** email/password signup + login works · Google OAuth login works · `/account` redirects unauthenticated users to `/sign-in` · `GET /auth/me` returns the local `UserDTO` for the signed-in Clerk user · home renders 8 products from the live API.
- **Merged:** PR #19

### ✅ Phase 6 — Frontend catalog (SSR)
- Schema extension: `Product` gained `brand`, `rating`, `reviewCount`, `originalPrice`. `CategoryDTO` gained `productCount`. Re-seeded with Faker. `db push --force-reset` to Supabase.
- Backend: `sort` query param (`top|newest|price-asc|price-desc`) on `GET /products`; `_count` aggregation on `GET /categories`; `getProductBySlug` returns all new fields.
- Frontend deps: `zustand` (wishlist + last-viewed with persist middleware).
- `ProductCard` hi-fi: `next/image`, brand label, badge (discount % / New / Best seller), wishlist heart, rating stars, price + originalPrice + save chip. Replaces `ProductCardSkeleton`.
- Home (`/`) — server component: category pills, shop-by-category (4-col), top sellers (5-col), newest (5-col), last-viewed (client, horizontal scroll), mini-cat row.
- `/products` — SSR, async `searchParams`, filters (category pills + search + sort form), `ProductGrid`, `Pagination`.
- `/products/[slug]` — SSR, `generateMetadata` with title + description + og:image, `ProductGallery`, rating, price/save, stock indicator, "Add to cart" disabled (Phase 7), wishlist button, related products, `TrackLastViewed`.
- Navbar: search wrapped in `<form action="/products">`, `CategoriesDropdown` client component, `WishlistBadge` (hydration-safe).
- Zustand stores: `wishlist-store` and `last-viewed-store` both with `persist` middleware, hydration-mismatch guard in badge and last-viewed.
- **Decision — SSR pattern:** home, /products, /products/[slug] use direct server fetch (no TanStack Query). Only /account keeps TanStack Query. Consistent with Phase 5.
- **Decision — `listCategories` in layout:** called once as async server component in `app/layout.tsx`; passed as prop to `<Navbar>`. Avoids redundant fetches per page.
- **Decision — `db push --force-reset`:** used for dev DB (seed-only data); `brand` is NOT NULL without a default so `--accept-data-loss` is insufficient. Reseed ran immediately after.
- **Merged:** PR #20
- **Exit criteria:** ✅ home renders all product-driven sections · ✅ `/products` filters by category, search, sort with pagination · ✅ `/products/[slug]` has metadata + OG tags · ✅ wishlist persists across reloads · ✅ last-viewed updates on detail visit

### ✅ Phase 7 — Cart & checkout (CSR)

> **Stripe (Phase 4) is deferred.** This phase shipped the full cart → checkout → confirmation flow with the order ending in `PENDING`. The payment step is a stubbed no-op (`lib/payment-stub.ts::confirmPayment`) — Phase 4 swaps it for Stripe Elements without touching the surrounding UI.

- **Cart (client-only):** Zustand store with `persist` middleware (key `storely.cart.v1`), mirrors the wishlist/last-viewed pattern. Hidratación-safe via the same `useHasHydrated` pattern used by `WishlistBadge`. Lives in localStorage.
- **Add-to-cart wiring:** enabled on `ProductCard` (icon overlay, `stopPropagation` under the outer `<Link>`) and `/products/[slug]` (primary button + quantity selector). Out-of-stock disables the button.
- **`CartBadge`** next to `WishlistBadge` in the navbar. Cart is now `<Link href="/cart">`, not a `<button>`.
- **`/cart` page:** line items, qty selector + remove, order summary, CTA to `/checkout`. Stock revalidation on mount via TanStack Query → `getProductsByIds`; clamps quantities, drops deactivated products, warns inline.
- **`/checkout` page:** address form (validated inline, no `react-hook-form`/`zod` deps added on the frontend), idempotency key in a `useRef` stable across the mount, pre-flight stock check against the cached batch, handles `409 CONFLICT` (back to /cart with message) and `UNAUTHORIZED` (sign-in with `returnUrl`).
- **Order pages:** `/orders/[id]/confirmation` (dedicated route), `/orders` (own list), `/orders/[id]` (detail). All client components using TanStack Query.
- **`/wishlist` page (closed a Phase 6 gap):** the navbar link was dead before this PR. Reuses the existing `wishlist-store` + the new `?ids=` endpoint.
- **`/account` linking:** added tiles for "Your orders" and "Wishlist" so the new routes are reachable from the UI.
- **Backend addition:** `GET /products?ids=id1,id2,...` — CSV query param on the existing list endpoint. When present, short-circuits all other filters and returns a flat `ProductDTO[]` of `isActive: true` products. Zod array of cuids, max 50. Used by cart, checkout, and wishlist.
- **Decision — shipping address is captured but not persisted.** Form renders and validates client-side but is **not** sent to the backend. `CreateOrderDTO` stays `{ items }`. No migration. Persisting now would mean re-shaping in Phase 9 with no value delivered. Checkout shows a banner about it.
- **Decision — confirmation as a dedicated page.** `/orders/[id]/confirmation` is a separate route, not a query-param flag on `/orders/[id]`. Cleaner mental model and easier to A/B / track conversion later.
- **Decision — totals hard-coded to $0 for shipping and tax.** Logic isolated in `lib/cart-totals.ts` so Phase 9 can swap in real calculation without touching UI. Subtotal = sum of snapshot `price × quantity`. UI labels: "Free" / "Calculated at next phase".
- **Decision — stock revalidation in both places.** `/cart` mount + `/checkout` submit, both via `getProductsByIds`. TanStack Query cache deduplicates. Backend `409` is still the source of truth — UI revalidation is purely UX polish to fail early before the address form.
- **Decision — `ids` param on existing `GET /products`, not a new endpoint.** One controller, one Zod schema. Early-returns when `ids` is present.
- **Decision — idempotency key lives in `useRef`, not state.** Generated once at checkout mount; a new key only on remount. State would risk a key change on rerender and break the dedupe contract.
- **Decision — no `react-hook-form` / `zod` on frontend.** The address form is simple enough for `useState` + inline validation. Zero new deps.
- **Decision — `confirmPayment(order)` stub seam.** Phase 4 replaces this function only; the checkout submit handler signature does not change.
- **Bug fixes that came up during integration:**
  - `WishlistButton` wasn't re-rendering on toggle — was selecting the function ref (`s.has`) from Zustand instead of the boolean. Changed to `s.ids.includes(productId)`. Same lesson applied in `CartBadge` via `selectItemCount`.
  - Checkout was redirecting to `/cart` instead of confirmation after a successful submit — `clearCart()` raced `router.push` and the bounce effect fired on the resulting empty state. Added a `placedOrderRef` flag set before `clearCart()` that short-circuits the bounce.
  - Categories dropdown was clipped — the search `<form>` had `overflow-hidden` to round the corners, which hid the absolute dropdown. Removed it.
  - Categories button submitted the search form (default `type="submit"` inside a `<form>`). Added `type="button"`.
- **Exit criteria:** ✅ cart persists, badge updates, clamps to stock · ✅ `/cart` revalidates stock on mount · ✅ checkout creates `PENDING` order, redirects to confirmation, clears cart · ✅ double-click "Place order" creates exactly one order · ✅ `stock = 0` race surfaces a readable 409 · ✅ unauthenticated `/checkout` → sign-in with returnUrl · ✅ `pnpm typecheck` + `pnpm build` green.
- **Merged:** PR #21

### ✅ Phase 8 — Admin panel

> Admin lives at `/admin` in the same frontend app. First admin promoted manually in DB (`UPDATE "User" SET role='ADMIN' WHERE email='...'`). Stripe is still deferred — admin can flip orders to PAID/SHIPPED/etc. manually for the demo.

#### Backend
- `GET /orders/admin/all` — list all orders with `status` and `search` filters (search matches order id prefix OR buyer email/name substring, case-insensitive).
- `GET /orders/admin/:id` — admin detail with `user: { id, email, name }` joined.
- `PATCH /orders/:id/status` — return shape upgraded to `AdminOrderDTO` (only admins call it).
- `POST /admin/uploads/sign` — admin-only, mints a Supabase Storage signed upload URL keyed on `products/<cuid>.<ext>`. Allowlist: `image/jpeg|png|webp`.
- New `lib/supabase.ts` singleton (service-role client).
- Env vars added to `env.ts` + `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (defaults to `product-images`).

#### Frontend
- **Route group refactor:** all storefront routes moved into `app/(shop)/` with their own `layout.tsx` (UtilityBar + Navbar + Footer). `app/layout.tsx` is now minimal (html/body/Providers). `app/admin/*` lives outside `(shop)` and has its own dedicated shell — top bar with logo + "View storefront ↗" + UserButton, sidebar nav, `bg-bg-warm` page background so admins can tell at a glance they're in the dashboard.
- `services/admin.ts` — typed wrappers for every admin endpoint (`listProductsAdmin`, `createProduct`, `updateProduct`, `softDeleteProduct`, `restoreProduct`, `createCategory`, `updateCategory`, `deleteCategory`, `listOrdersAdmin`, `getOrderAdmin`, `updateOrderStatus`, `signProductImageUpload`, `uploadProductImage`).
- `app/admin/layout.tsx` — server component, calls `auth().getToken()` + `getMe(token)`, redirects non-admins to `/`. UI gate; backend `requireRole('ADMIN')` is the actual security boundary.
- `app/admin/page.tsx` — dashboard with tile grid (Products / Categories / Orders).
- **Categories CRUD** (`/admin/categories`, `.../new`, `.../[id]/edit`) — list table with inline delete, shared `CategoryForm` with auto-slug + manual override. Delete maps `409 CONFLICT` to "Can't delete this category — it still has products."
- **Products CRUD** (`/admin/products`, `.../new`, `.../[id]/edit`) — list with client-side search/category filter/`Show inactive` toggle (admin endpoint already returns everything), shared `ProductForm` with auto-slug, dollar↔cents conversion at the boundary, category select, and `ImageUploader`. Soft-delete + restore inline.
- `components/admin/ImageUploader.tsx` — multi-image picker, runs each file through `services/admin.uploadProductImage` (sign → PUT to Supabase → push `publicUrl`), reorder up/down, remove, "Cover" badge on the first image, client-side size/type validation.
- **Orders admin** (`/admin/orders`, `.../[id]`) — server-side filtered list (status + search) with real pagination, detail with status dropdown + Update button. `StatusBadge` color-coded by state.
- `next.config.ts` updated with `*.supabase.co/storage/v1/object/public/**` in `remotePatterns` so uploaded images render via `next/image`.
- `/account` shows an "Admin panel" tile when `data.role === 'ADMIN'` (UI affordance; layout gate is the real check).

#### Decisions
- **Admin in same frontend, not separate app.** Same bundle, same Clerk session, same theme. Splitting would duplicate Clerk + providers + layout for zero MVP value.
- **First admin promoted manually in DB.** A `PATCH /users/:id/role` would still need a bootstrap path — out of scope until user management is built.
- **Server-side role check in layout, on top of middleware.** Middleware enforces "signed in"; layout enforces "signed in AND admin". A logged-in regular user hitting `/admin` is redirected to `/` before any admin UI renders.
- **`AdminOrderDTO` extends `OrderDTO` with `user: { id, email, name }`.** Admin order list needs buyer identity; the user-facing DTO must not carry it.
- **Image upload via signed URL, not API proxy.** Frontend → Supabase Storage directly. The API mints a short-lived signed URL and never sees bytes. Avoids doubling traffic and Express body-parser limits.
- **Public bucket for product images.** Served on the public storefront anyway — no point making them private and adding signed-read overhead on every page.
- **No DELETE for uploaded images.** Orphans tolerated for the MVP; cleanup job deferred to Phase 9.
- **No `react-hook-form` / `zod` on the frontend.** Inline validation matches Phase 7 — server-side Zod is the contract.
- **Soft-delete with "Show inactive" toggle + Restore.** Admin endpoint already returns all rows; filter is purely client-side.
- **Admin lists use TanStack Query, not server-side fetch.** Mutation flow needs cache invalidation — uniform client-side fetching makes the patterns identical across all three CRUDs.
- **Route group refactor done at the end of the phase, not at the start.** Felt cleaner once the admin pages existed and we could see the visual collision with the shop nav.
- **Bucket CORS not configured.** Supabase Storage's public REST API responds with permissive CORS by default; nothing extra needed for signed-URL PUTs.
- **`PHASE8-PLAN.md` deleted on merge** — folded into this entry.

#### Out-of-code work (the user)
- Created the `product-images` Supabase Storage bucket (public read).
- Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env`.
- Promoted self to ADMIN via SQL.

#### Exit criteria
- ✅ `/admin` redirects regular users to `/`, unauthenticated to `/sign-in`, lets ADMIN through.
- ✅ Products create (with image upload) → image renders on public `/products/[slug]`.
- ✅ Edit, soft-delete, restore round-trip.
- ✅ Categories create / edit / delete; FK-blocked delete surfaces a readable error.
- ✅ Orders list shows multi-user data, status filter works, status transitions persist.
- ✅ Image upload completes in 2 round-trips per file (sign + PUT); API never sees bytes.
- ✅ Non-admin calling admin endpoints directly gets `403 FORBIDDEN`.
- ✅ `pnpm typecheck` + `pnpm build` green.

- **Merged:** PR #TBD

### 🔜 Phase 9 — Hardening & deploy
- Supabase per-table RLS policies (on top of RLS already enabled in Phase 0.5)
  - **Threat model:** the API uses the service role and bypasses RLS, so RLS policies are pure defense-in-depth. Their value is to fail safe if (a) the anon key ever leaks into a client bundle, or (b) a future feature ever calls Supabase from the browser directly. Policies should be restrictive by default: deny all, then allow nothing for anon (until a feature explicitly requires it). Note: with Clerk as the identity provider, `auth.uid()` is not populated in Supabase the way it would be with Supabase Auth — RLS policies key on explicit `user_id` columns rather than `auth.uid()`.
- Clerk `user.created` webhook → optional pre-provisioning of the local `User` row (deferred from Phase 1). Worth adding here if welcome emails, signup analytics, or eager profile creation become priorities. Pattern mirrors the Stripe webhook handler (signature verification, idempotency keyed on event id).
- Logging + error tracking (Sentry)
- Rate limit tuning, CORS audit, secrets review (rotate any dev secrets before production)
- CI: Turborepo affected-only on PRs
- Deploy: API → Railway, frontend → Vercel, production Supabase
- **Exit criteria:** live domain, Stripe live keys, smoke test passes

---

## Tooling backlog (off the critical path)

Items surfaced during the Phase 1 Dependabot cleanup that don't gate any feature but should be tackled before the corresponding upgrade can land. None of them block phase progression.

- **ESLint flat config migration.** The repo is on ESLint 9 but still uses legacy `.eslintrc` config, so `pnpm lint` fails on main (`ESLint couldn't find an eslint.config.(js|mjs|cjs) file`). Fix: add an `eslint.config.js` at the root (and per-app overrides as needed), migrate any existing rules, then accept the next Dependabot ESLint bump. Unblocks PR #4 (and any future ESLint / `eslint-config-next` bumps).
- **Prisma 6/7 migration.** Prisma 7 changed how the client and model types are exported — `PrismaClient` and named model types like `User` no longer come out of `@prisma/client` directly, and `packages/database/src/index.ts` plus every consumer that imports model types needs to be updated. Worth doing in a dedicated PR with a fresh `prisma generate` and a typecheck pass across `apps/api`. Unblocks PR #6 when it reopens.
- **TypeScript 6 / `moduleResolution` migration.** TS 6 deprecates `moduleResolution: "Node"` (node10). `apps/api/tsconfig.json` currently uses it. Two paths: (a) add `"ignoreDeprecations": "6.0"` and kick the can to TS 7, or (b) migrate to `"node16"` / `"bundler"` properly — the latter may require `.js` import extensions and a peer-dep audit. Unblocks PR #10 when it reopens.

---

## Execution order

| Phase | Depends on |
|---|---|
| 1 | — |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 |
| 5 | 1 (auth contract stable) |
| 6 | 2 |
| 7 | 3 + 4 |
| 8 | 5 (parallelizable with 7) |
| 9 | throughout, gates launch |

---

## How to update this plan

- When a phase merges: change its heading to ✅, add the `**Merged:** PR #N` line, and move the 🔜 marker to the next phase.
- When a non-trivial decision is taken mid-phase (isolation level, library choice, schema shape): add it as a `**Decision —**` bullet in that phase. Future sessions read decisions, not chat history.
- When a phase's exit criteria change: update the bullet, don't add a new one — exit criteria should be the current contract.
- Do not delete completed phase content. The plan doubles as a changelog.

---

## End-to-end smoke test

1. `pnpm install && pnpm db:generate && pnpm db:migrate`
2. `pnpm dev`
3. Register → login → browse catalog → add to cart → checkout with `4242 4242 4242 4242`
4. `stripe listen --forward-to localhost:3001/webhooks/stripe` → confirm order flips to `PAID`
5. Login as admin → `/admin` → update order status → confirm visible in customer view
6. `pnpm build && pnpm typecheck && pnpm lint` — all green
7. Push to `main` → Vercel + Railway deploy → repeat smoke test on live domain
