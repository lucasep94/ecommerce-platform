"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryDTO } from "@ecommerce/types";
import { createCategory, updateCategory } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";

interface Props {
  /** Existing category for edit mode; absent for create. */
  initial?: CategoryDTO;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Auto-slug helper: lowercase, replace non-alphanumerics with hyphens,
 * collapse repeated hyphens, trim hyphens at the edges. Matches what the
 * backend Zod regex accepts (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`).
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryForm({ initial }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // True until the user manually edits the slug; while true, typing in
  // `name` auto-derives the slug. Avoids having to maintain a slug for
  // most users without taking control away from someone who wants a
  // specific URL.
  const [slugAuto, setSlugAuto] = useState(!isEdit);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (isEdit) {
        return updateCategory(initial!.id, { name, slug }, token);
      }
      return createCategory({ name, slug }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      router.push("/admin/categories");
    },
  });

  const errors: { name?: string; slug?: string } = {};
  if (name.trim().length < 1) errors.name = "Required";
  if (!SLUG_RE.test(slug)) errors.slug = "Lowercase letters, numbers and hyphens only";
  const valid = Object.keys(errors).length === 0;

  function handleNameChange(value: string) {
    setName(value);
    if (slugAuto) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugAuto(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || mutation.isPending) return;
        mutation.mutate();
      }}
      className="max-w-xl"
    >
      <h1 className="mb-6 font-heading text-[24px] font-bold text-heading">
        {isEdit ? `Edit ${initial!.name}` : "New category"}
      </h1>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
        <label className="flex flex-col gap-1 font-body text-[12px]">
          <span className="font-medium text-heading">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,175,24,0.15)] ${
              errors.name && name !== "" ? "border-red-400" : "border-border"
            }`}
          />
          {errors.name && name !== "" && (
            <span className="text-[11px] text-red-600">{errors.name}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 font-body text-[12px]">
          <span className="font-medium text-heading">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={`h-10 rounded-lg border bg-white px-3 font-mono text-[12px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,175,24,0.15)] ${
              errors.slug && slug !== "" ? "border-red-400" : "border-border"
            }`}
          />
          {errors.slug && slug !== "" ? (
            <span className="text-[11px] text-red-600">{errors.slug}</span>
          ) : (
            <span className="text-[11px] text-muted">
              {slugAuto ? "Auto-generated from name. Click to override." : "Manually edited."}
            </span>
          )}
        </label>

        {mutation.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
            {mutation.error instanceof ApiClientError
              ? mutation.error.code === "CONFLICT"
                ? "A category with that slug already exists."
                : `${mutation.error.code}: ${mutation.error.message}`
              : mutation.error.message}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={!valid || mutation.isPending}
          className="rounded-full bg-accent px-6 py-2.5 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </button>
        <Link
          href="/admin/categories"
          className="font-body text-[13px] text-muted hover:text-heading"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
