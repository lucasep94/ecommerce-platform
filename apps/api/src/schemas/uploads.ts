import { z } from "zod";

/**
 * Allowed image MIME types for product uploads. Keep this tight — anything
 * outside the list is rejected at the controller layer. JPEG/PNG cover most
 * source material; WebP is enabled for the optimized output that some image
 * editors emit by default.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const signUploadSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
});
