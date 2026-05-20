import { randomBytes } from "crypto";
import type { SignUploadResponse } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabase";
import type { AllowedImageMimeType } from "../schemas/uploads";

const MIME_TO_EXT: Record<AllowedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Build the public URL for an object in a public bucket. We construct it
 * deterministically from the project URL + bucket + path rather than
 * calling `getPublicUrl()` to avoid an extra round-trip. The shape is
 * stable across Supabase versions.
 */
function publicUrlFor(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${path}`;
}

export const uploadsService = {
  async signProductImageUpload(
    contentType: AllowedImageMimeType,
  ): Promise<SignUploadResponse> {
    const ext = MIME_TO_EXT[contentType];
    // 16 random bytes → 32 hex chars. Collision probability is negligible
    // even at millions of uploads; no need to involve the DB.
    const path = `products/${randomBytes(16).toString("hex")}.${ext}`;

    const { data, error } = await supabaseAdmin()
      .storage.from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new ApiError(
        "INTERNAL_ERROR",
        `Failed to mint upload URL: ${error?.message ?? "unknown error"}`,
        500,
      );
    }

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
      publicUrl: publicUrlFor(path),
      path,
    };
  },
};
