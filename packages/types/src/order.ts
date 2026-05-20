export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface OrderDTO {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  stripePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
}

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

/**
 * Admin-only variant of OrderDTO. Includes the buyer's identity so the
 * admin orders list can show "who placed this" without an extra round-trip.
 * The user-facing OrderDTO intentionally does NOT carry this field —
 * users only ever see their own orders.
 */
export interface AdminOrderDTO extends OrderDTO {
  user: {
    id: string;
    email: string;
    name: string;
  };
}
