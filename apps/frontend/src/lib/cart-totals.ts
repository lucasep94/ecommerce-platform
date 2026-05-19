import type { CartItemDTO } from "@ecommerce/types";

export interface CartTotals {
  /** Sum of `price × quantity` across all line items, in cents. */
  subtotal: number;
  /** Hard-coded to 0 for the MVP. Real calculation lands in Phase 9. */
  shipping: number;
  /** Hard-coded to 0 for the MVP. Real calculation lands in Phase 9. */
  tax: number;
  /** subtotal + shipping + tax (= subtotal while shipping/tax are 0). */
  total: number;
}

/**
 * Computes order totals from the cart snapshot. Shipping and tax are
 * placeholders for Phase 9; isolating them here means the UI never has to
 * change when real values arrive — only this file does.
 */
export function computeCartTotals(items: CartItemDTO[]): CartTotals {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = 0;
  const tax = 0;
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}
