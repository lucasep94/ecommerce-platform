/**
 * Cart lives only on the client (Zustand + localStorage). The backend never
 * sees a CartItemDTO — it sees `CreateOrderDTO` at checkout. We keep these
 * fields denormalized so the cart UI can render without refetching products,
 * and so the cart survives a page reload without a network call.
 *
 * `price` is a snapshot for display only; the API recomputes the authoritative
 * total from the DB at `POST /orders`.
 */
export interface CartItemDTO {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  price: number;
  quantity: number;
  stock: number;
}
