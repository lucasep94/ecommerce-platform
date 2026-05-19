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

### 🔜 Phase 4 — Stripe integration (backend)
- Create `PaymentIntent` on order placement, return `clientSecret`
- `POST /webhooks/stripe` — signature verification, then idempotent handler keyed on `event.id`
- Order status transitions: `PENDING → PAID` / `CANCELLED`
- **Decision — webhook idempotency storage:** add a `WebhookEvent { id String @id; type String; processedAt DateTime @default(now()) }` table in the Phase 4 migration. Handler does `INSERT ... ON CONFLICT DO NOTHING`; if the insert is a no-op, the event was already processed and the handler returns 200 without side effects. Keying on `event.id` (Stripe's own ID) makes this robust to Stripe's at-least-once delivery.
- **Exit criteria:**
  - Stripe CLI replay flips order to `PAID`
  - Duplicate webhook (same `event.id`) is a no-op — verified by replaying the same event twice and confirming no double-write
  - Invalid signature → 400, no DB write

### Phase 5 — Frontend foundation
- **Clerk integration via `@clerk/nextjs`**: `<ClerkProvider />` at the root, `clerkMiddleware` for route protection, `<SignIn />` / `<SignUp />` components on auth pages (email/password form + Google OAuth button — both rendered by the same component, enabled-state driven by Clerk dashboard config).
- Typed HTTP layer in `apps/frontend/src/services/` using `@ecommerce/types`; attaches `Authorization: Bearer ${await auth().getToken()}` (server) or `useAuth().getToken()` (client) on every API call.
- TanStack Query provider, error boundaries, app shell, route protection via Clerk middleware matchers.
- **Removed:** NextAuth v5, custom refresh logic, 401-refresh queue. Clerk SDK handles token refresh transparently — the queue concern from the earlier plan is moot.
- **Exit criteria:** email/password signup + login works; Google OAuth login works; protected pages redirect unauthenticated users; `GET /auth/me` from the API returns the local `UserDTO` for the signed-in Clerk user.

### Phase 6 — Frontend catalog (SSR)
- Home, product list, product detail — SSR for SEO
- Category nav, search UI
- **Exit criteria:** Lighthouse SEO ≥ 90 on product detail; metadata + Open Graph populated

### Phase 7 — Cart & checkout (CSR)
- Client-side cart (Zustand or Context) — no server-side cart for v1; cart lives in localStorage and is replayed at checkout
- Checkout: address form → `POST /orders` (with `Idempotency-Key` from a UUID generated at checkout-mount) → Stripe Elements with `clientSecret`
- Order confirmation page — TanStack Query revalidation
- **Exit criteria:** test-mode card purchase succeeds end-to-end; double-submit on the checkout button creates exactly one order

### Phase 8 — Admin panel
- Product / category CRUD UI
- Order list with status updates
- `/admin` route, gated by `role === 'ADMIN'`
- Parallelizable with Phase 7

### Phase 9 — Hardening & deploy
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
