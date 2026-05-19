import type { CreateOrderDTO, OrderDTO, Paginated } from "@ecommerce/types";
import { apiFetch } from "./api-client";

interface CreateOrderOpts {
  token: string;
  /** Stable per checkout mount — backend dedupes duplicate submits via this header. */
  idempotencyKey: string;
}

export function createOrder(
  dto: CreateOrderDTO,
  { token, idempotencyKey }: CreateOrderOpts,
): Promise<OrderDTO> {
  return apiFetch<OrderDTO>("/orders", {
    method: "POST",
    body: dto,
    token,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function getOrder(id: string, token: string): Promise<OrderDTO> {
  return apiFetch<OrderDTO>(`/orders/${id}`, { token });
}

interface ListOrdersParams {
  page?: number;
  pageSize?: number;
}

export function listOrders(
  token: string,
  params: ListOrdersParams = {},
): Promise<Paginated<OrderDTO>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const q = qs.toString();
  return apiFetch<Paginated<OrderDTO>>(`/orders${q ? `?${q}` : ""}`, { token });
}
