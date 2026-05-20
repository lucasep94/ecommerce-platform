import type {
  AdminOrderDTO,
  CategoryDTO,
  CreateCategoryDTO,
  CreateProductDTO,
  OrderStatus,
  Paginated,
  ProductDTO,
  SignUploadRequest,
  SignUploadResponse,
  UpdateCategoryDTO,
  UpdateProductDTO,
} from "@ecommerce/types";
import { apiFetch } from "./api-client";

/**
 * Centralized service layer for the admin panel. Every function takes a
 * Clerk session token explicitly — admin pages always render in client
 * components that hold the token via `useAuth().getToken()`, never via
 * server components (the layout role check is the only server-side
 * touchpoint).
 *
 * All endpoints here require `role === 'ADMIN'` on the backend; a logged-in
 * non-admin will get `403 FORBIDDEN` even if they somehow reach the calls.
 */

// ─── Products ──────────────────────────────────────────────────────────

interface ListProductsAdminParams {
  page?: number;
  pageSize?: number;
}

export function listProductsAdmin(
  token: string,
  params: ListProductsAdminParams = {},
): Promise<Paginated<ProductDTO>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const q = qs.toString();
  return apiFetch<Paginated<ProductDTO>>(`/products/admin/all${q ? `?${q}` : ""}`, { token });
}

export function createProduct(dto: CreateProductDTO, token: string): Promise<ProductDTO> {
  return apiFetch<ProductDTO>("/products", { method: "POST", body: dto, token });
}

export function updateProduct(
  id: string,
  dto: UpdateProductDTO,
  token: string,
): Promise<ProductDTO> {
  return apiFetch<ProductDTO>(`/products/${id}`, { method: "PATCH", body: dto, token });
}

/** Soft delete: sets isActive=false. Idempotent on the backend. */
export function softDeleteProduct(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE", token });
}

/** Restore a previously soft-deleted product — just a thin alias over PATCH. */
export function restoreProduct(id: string, token: string): Promise<ProductDTO> {
  return updateProduct(id, { isActive: true }, token);
}

// ─── Categories ────────────────────────────────────────────────────────

export function createCategory(
  dto: CreateCategoryDTO,
  token: string,
): Promise<CategoryDTO> {
  return apiFetch<CategoryDTO>("/categories", { method: "POST", body: dto, token });
}

export function updateCategory(
  id: string,
  dto: UpdateCategoryDTO,
  token: string,
): Promise<CategoryDTO> {
  return apiFetch<CategoryDTO>(`/categories/${id}`, { method: "PATCH", body: dto, token });
}

/**
 * Deleting a category with products yields a `409 CONFLICT` from the API
 * (FK constraint). Callers should handle that explicitly and surface the
 * error to the user.
 */
export function deleteCategory(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: "DELETE", token });
}

// ─── Orders (admin) ────────────────────────────────────────────────────

interface ListOrdersAdminParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
}

export function listOrdersAdmin(
  token: string,
  params: ListOrdersAdminParams = {},
): Promise<Paginated<AdminOrderDTO>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const q = qs.toString();
  return apiFetch<Paginated<AdminOrderDTO>>(`/orders/admin/all${q ? `?${q}` : ""}`, { token });
}

export function getOrderAdmin(id: string, token: string): Promise<AdminOrderDTO> {
  return apiFetch<AdminOrderDTO>(`/orders/admin/${id}`, { token });
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  token: string,
): Promise<AdminOrderDTO> {
  return apiFetch<AdminOrderDTO>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

// ─── Uploads ───────────────────────────────────────────────────────────

export function signProductImageUpload(
  dto: SignUploadRequest,
  token: string,
): Promise<SignUploadResponse> {
  return apiFetch<SignUploadResponse>("/admin/uploads/sign", {
    method: "POST",
    body: dto,
    token,
  });
}

/**
 * Upload a single file to Supabase Storage via the signed URL flow:
 *   1. POST /admin/uploads/sign with the content type → uploadUrl + publicUrl.
 *   2. PUT the file body directly to uploadUrl (the API never sees the bytes).
 *
 * Returns the final `publicUrl` to persist in `Product.images[]`. Throws on
 * either step's failure with a descriptive message so the UI can surface it.
 */
export async function uploadProductImage(file: File, token: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  const signed = await signProductImageUpload({ contentType: file.type }, token);

  const res = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return signed.publicUrl;
}
