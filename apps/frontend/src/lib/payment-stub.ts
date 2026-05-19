import type { OrderDTO } from "@ecommerce/types";

/**
 * No-op payment confirmation. Phase 4 replaces this with a Stripe Elements
 * flow that takes `order.stripePaymentId` → fetches the clientSecret →
 * mounts the Payment Element → confirms the PaymentIntent. The function
 * signature is the seam: the checkout submit handler doesn't change.
 */
export async function confirmPayment(_order: OrderDTO): Promise<void> {
  // Intentionally empty until Phase 4.
}
