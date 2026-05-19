import type { Paginated, ProductDTO } from "@ecommerce/types";
import { apiFetch } from "./api-client";

interface ListProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export function listProducts(params: ListProductsParams = {}): Promise<Paginated<ProductDTO>> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.category) search.set("category", params.category);
  if (params.search) search.set("search", params.search);
  const qs = search.toString();
  return apiFetch<Paginated<ProductDTO>>(`/products${qs ? `?${qs}` : ""}`);
}
