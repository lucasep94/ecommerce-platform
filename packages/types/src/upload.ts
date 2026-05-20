/**
 * Image-upload contract used by the admin panel.
 *
 * Flow:
 *   1. Frontend posts `{ contentType }` to POST /admin/uploads/sign.
 *   2. API mints a signed upload URL against Supabase Storage and returns
 *      `{ uploadUrl, token, publicUrl, path }`.
 *   3. Frontend PUTs the file bytes directly to `uploadUrl` (the API never
 *      handles the bytes).
 *   4. Frontend persists `publicUrl` in `Product.images[]` via the existing
 *      product create/update endpoints.
 *
 * `path` is the bucket key — kept for a future cleanup job that reconciles
 * orphaned objects against `Product.images`.
 */
export interface SignUploadRequest {
  /** MIME type, e.g. "image/jpeg". Validated server-side against an allowlist. */
  contentType: string;
}

export interface SignUploadResponse {
  /** PUT the file body here with `Content-Type: <contentType>`. */
  uploadUrl: string;
  /** Supabase signed-upload token; included in `uploadUrl` already, exposed for SDKs that need it explicitly. */
  token: string;
  /** Persist this URL in `Product.images[]`. */
  publicUrl: string;
  /** Bucket key, e.g. "products/abc123.jpg". */
  path: string;
}
