import type { Paginated, ProductDTO } from "@ecommerce/types";
import { apiFetch } from "./api-client";

export type SortOption = "top" | "newest" | "price-asc" | "price-desc";

interface ListProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  sort?: SortOption;
}

export function listProducts(params: ListProductsParams = {}): Promise<Paginated<ProductDTO>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  const q = qs.toString();
  return apiFetch<Paginated<ProductDTO>>(`/products${q ? `?${q}` : ""}`);
}

export function getProductBySlug(slug: string): Promise<ProductDTO> {
  return apiFetch<ProductDTO>(`/products/${slug}`);
}

/**
 * Fetch a batch of products by id for cart/checkout stock revalidation. The
 * backend returns a flat ProductDTO[] (not paginated) when `ids` is present.
 * Returns an empty array if `ids` is empty so callers can skip a network call.
 */
export function getProductsByIds(ids: string[]): Promise<ProductDTO[]> {
  if (ids.length === 0) return Promise.resolve([]);
  const qs = new URLSearchParams({ ids: ids.join(",") }).toString();
  return apiFetch<ProductDTO[]>(`/products?${qs}`);
}
