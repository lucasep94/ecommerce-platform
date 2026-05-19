# Phase 7 — Cart & checkout (CSR)

> **Stripe is deferred (Phase 4).** This phase ships the full cart → checkout → confirmation flow with the order ending in `PENDING`. The payment step is a stubbed no-op designed to be replaced by Stripe Elements without touching the surrounding UI.

## Scope

- **Cart (client-only):** Zustand store with `persist` middleware (key `cart-v1`), mirrors the wishlist/last-viewed pattern from Phase 6. Hidratación-safe via the same `useHasHydrated` guard used by `WishlistBadge`. Lives in localStorage; no server-side cart.
- **Add-to-cart wiring:** enable the existing buttons on `ProductCard` and `/products/[slug]`. Detail page gains a quantity selector (1..stock). Out-of-stock disables the button.
- **`CartBadge`** next to `WishlistBadge` in the navbar shell. Shows `itemCount`, links to `/cart`.
- **`/cart` page (client component):** line items with quantity selector + remove, order summary, CTA to `/checkout`. Empty state with CTA to `/products`.
- **Stock revalidation at two points:**
  - On `/cart` mount: TanStack Query → `getProductsByIds(ids)`. If `stock < quantity`, clamp and show an inline warning; if `stock === 0`, mark out-of-stock and block checkout.
  - On `/checkout` submit: same query (served from cache if recent). If anything changed, block submit and bounce back to `/cart` with the warning.
  - Backend `409 CONFLICT` from `POST /orders` remains the final safety net for races.
- **`/checkout` page:** address form (validated with Zod + react-hook-form) → "Place order" → `POST /orders` with `Idempotency-Key` header → redirect to confirmation. Empty cart on mount redirects to `/cart`. Unauthenticated users go through `clerkMiddleware` (route already in the Phase 5 allowlist).
- **Idempotency:** `crypto.randomUUID()` captured once in a `useRef` at checkout mount. Double-click sends the same header; backend returns the same order (Phase 3 contract).
- **Order pages:** `/orders/[id]/confirmation` (dedicated, client component, TanStack Query → `getOrder`), `/orders` (own list), `/orders/[id]` (detail). Confirmation shows order number, items, total, status `PENDING`, and a banner explaining payment is deferred until Phase 4.
- **Stripe stub:** payment flow isolated behind `confirmPayment(order)` that resolves immediately. No `@stripe/*` packages installed yet — added with Phase 4.

## Contracts (`packages/types`)

- New `packages/types/src/cart.ts` with `CartItemDTO { productId, slug, name, brand, image, price, quantity, stock }` (denormalized snapshot for cart UI; backend recomputes `total` from DB).
- `CreateOrderDTO` unchanged — cart maps to `{ items: [{ productId, quantity }] }` at submit. No address field in the contract (see decision below).
- Re-export from `packages/types/src/index.ts`.

## Backend additions

- `GET /products?ids=id1,id2,...` — accept an `ids` CSV query param on the existing list endpoint. When present, ignore `category/search/sort/page` and return matching `isActive: true` products. Zod: array of cuids, max 50. Used by stock revalidation.
- Verify `POST /orders` `409 CONFLICT` response includes `details` identifying the offending item (Phase 3 says it does — confirm before wiring UI).

## Decisions

- **Shipping address — capture, do not persist.** Address form is rendered and validated client-side but is **not** sent to the backend. No migration to `Order`; `CreateOrderDTO` stays as `{ items }`. Checkout shows a banner: "Shipping address is not stored in this MVP — persistence lands in Phase 9 with a proper `Address` model." Persisting now would mean re-shaping in Phase 9 with no value delivered.
- **Confirmation as a dedicated page.** `/orders/[id]/confirmation` is a separate route, not a query-param flag on `/orders/[id]`. Cleaner mental model and easier to A/B / track conversion later.
- **Totals hard-coded to $0 for shipping and tax.** Subtotal = sum of snapshot `price × quantity`. Shipping = $0 ("Free"). Tax = $0 ("Calculated at next phase"). Total = subtotal. Logic isolated in `lib/cart-totals.ts` so Phase 9 can swap in real calculation without touching UI.
- **Stock revalidation in both places.** `/cart` mount + `/checkout` submit, both via `getProductsByIds`. TanStack Query cache deduplicates. Backend 409 is still the source of truth — UI revalidation is purely UX polish to fail early before the address form.
- **`ids` param on existing `GET /products`, not a new endpoint.** One endpoint, one Zod schema, one controller. Early-returns when `ids` is present.
- **Idempotency key lives in a `useRef`, not state.** Generated once at checkout mount; a new key only on remount. State would risk a key change on rerender and break the dedupe contract.
- **No address persistence + no Stripe = no schema changes this phase.** Phase 7 is frontend-only plus one tiny backend additive endpoint. Migration-free.

## Reuse

- `apiFetch` / `ApiClientError` from `apps/frontend/src/services/api-client.ts`.
- `useHasHydrated` pattern from `apps/frontend/src/lib/wishlist-store.ts`.
- `Paginated<T>` envelope and `ProductDTO` from `packages/types`.
- TanStack Query provider already mounted in `apps/frontend/src/app/providers.tsx`.

## Exit criteria

- Add to cart from `ProductCard` and `/products/[slug]`; badge updates; cart persists across reload.
- `/cart`: change quantity, remove, clear, clamp to live stock on mount; out-of-stock blocks checkout CTA.
- `/checkout`: form validates; submit creates a `PENDING` order, redirects to `/orders/[id]/confirmation`, clears the cart.
- Double-click "Place order" creates exactly one order (verified via `GET /orders`).
- Forcing `stock = 0` in another tab between `/cart` and submit → `409` surfaces a readable error, cart stays intact, user is sent back to `/cart`.
- Unauthenticated `/checkout` → sign-in with `returnUrl` back to `/checkout`.
- `pnpm build && pnpm typecheck && pnpm lint` all green.

## Execution order

1. Backend: `GET /products?ids=...` + Zod.
2. `packages/types/src/cart.ts` + re-export.
3. `cart-store` (Zustand + persist) + `CartBadge` + enable "Add to cart" on card and detail.
4. `services/orders.ts` + `services/products.ts::getProductsByIds`.
5. `/cart` page with stock revalidation.
6. `/checkout` page (form, revalidation, idempotency, submit, Stripe stub).
7. `/orders/[id]/confirmation` + `/orders` + `/orders/[id]`.
8. `lib/cart-totals.ts` isolated.
9. Smoke test + fold this file into PLAN.md (replacing the Phase 7 bullet) and mark ✅ with PR #.
