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
