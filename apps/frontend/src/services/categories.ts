import type { CategoryDTO } from "@ecommerce/types";
import { apiFetch } from "./api-client";

export function listCategories(): Promise<CategoryDTO[]> {
  return apiFetch<CategoryDTO[]>("/categories");
}

export function getCategoryBySlug(slug: string): Promise<CategoryDTO> {
  return apiFetch<CategoryDTO>(`/categories/${slug}`);
}
