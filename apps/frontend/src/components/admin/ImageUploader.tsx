"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { uploadProductImage } from "@/services/admin";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  /** Max bytes per file. Defaults to 5MB. */
  maxBytes?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Multi-image picker for the product form. Each file goes through the
 * signed-URL flow (services/admin.ts::uploadProductImage):
 *   POST /admin/uploads/sign → PUT to Supabase Storage → push publicUrl.
 * The API never sees the bytes; the form persists the resulting URLs in
 * `Product.images[]`.
 *
 * No drag-and-drop, no DnD reorder — keep it minimal. Up/down buttons and
 * remove are enough for MVP; first image is the card thumbnail elsewhere.
 */
export function ImageUploader({ images, onChange, maxBytes = 5 * 1024 * 1024 }: Props) {
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`Unsupported type: ${file.type || "unknown"}. Use JPEG, PNG or WebP.`);
        }
        if (file.size > maxBytes) {
          throw new Error(`${file.name} is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).`);
        }
        const url = await uploadProductImage(file, token);
        newUrls.push(url);
      }
      onChange([...images, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(idx: number, delta: -1 | 1) {
    const next = [...images];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, idx) => (
          <div
            key={url}
            className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-[#f5f5f7]"
          >
            <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
            <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-red-600 hover:bg-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-heading hover:bg-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, +1)}
                  disabled={idx === images.length - 1}
                  className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-heading hover:bg-white disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-heading">
                Cover
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-white text-muted hover:border-accent hover:text-heading disabled:opacity-50"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-[10px] font-medium">
            {uploading ? "Uploading…" : "Add image"}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">{error}</p>
      )}
      <p className="font-body text-[11px] text-muted">
        JPEG, PNG or WebP · up to {Math.round(maxBytes / 1024 / 1024)}MB each · first image is the cover.
      </p>
    </div>
  );
}
