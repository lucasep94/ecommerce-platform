"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryDTO, CreateProductDTO, ProductDTO } from "@ecommerce/types";
import { listCategories } from "@/services/categories";
import { createProduct, updateProduct } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";
import { ImageUploader } from "./ImageUploader";

interface Props {
  initial?: ProductDTO;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Cents → dollar string for the input (e.g. 12345 → "123.45"). */
function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

/** Dollar string from the input → cents (e.g. "123.45" → 12345). Empty → null. */
function inputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

/**
 * Shared form for creating and editing products. Prices are entered in
 * dollars (UX) and converted to cents (storage) at submit time — matches
 * the rest of the app that displays cents-as-currency via `formatPrice`.
 */
export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugAuto, setSlugAuto] = useState(!isEdit);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(centsToInput(initial?.price));
  const [originalPrice, setOriginalPrice] = useState(centsToInput(initial?.originalPrice));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const priceCents = inputToCents(price);
  const originalPriceCents = inputToCents(originalPrice);
  const stockNum = Number(stock);

  const errors: Record<string, string> = {};
  if (name.trim().length < 1) errors.name = "Required";
  if (!SLUG_RE.test(slug)) errors.slug = "Lowercase letters, numbers and hyphens only";
  if (brand.trim().length < 1) errors.brand = "Required";
  if (description.trim().length < 1) errors.description = "Required";
  if (priceCents === null || priceCents <= 0) errors.price = "Must be greater than 0";
  if (originalPrice !== "" && originalPriceCents === null)
    errors.originalPrice = "Invalid amount";
  if (!Number.isInteger(stockNum) || stockNum < 0) errors.stock = "Must be a non-negative integer";
  if (!categoryId) errors.categoryId = "Pick a category";
  const valid = Object.keys(errors).length === 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const dto: CreateProductDTO = {
        slug,
        name: name.trim(),
        description: description.trim(),
        brand: brand.trim(),
        price: priceCents!,
        originalPrice: originalPriceCents,
        stock: stockNum,
        images,
        categoryId,
      };
      if (isEdit) {
        return updateProduct(initial!.id, dto, token);
      }
      return createProduct(dto, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      router.push("/admin/products");
    },
  });

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
      className="max-w-3xl"
    >
      <h1 className="mb-6 font-heading text-[24px] font-bold text-heading">
        {isEdit ? `Edit ${initial!.name}` : "New product"}
      </h1>

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" error={name !== "" ? errors.name : undefined}>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputCls(errors.name && name !== "")}
            />
          </Field>

          <Field
            label="Slug"
            error={slug !== "" ? errors.slug : undefined}
            hint={
              !errors.slug
                ? slugAuto
                  ? "Auto-generated from name."
                  : "Manually edited."
                : undefined
            }
          >
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={`${inputCls(errors.slug && slug !== "")} font-mono text-[12px]`}
            />
          </Field>

          <Field label="Brand" error={brand !== "" ? errors.brand : undefined}>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={inputCls(errors.brand && brand !== "")}
            />
          </Field>

          <Field label="Category" error={errors.categoryId}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls(errors.categoryId)}
            >
              <option value="">— Select —</option>
              {categoriesQuery.data?.map((c: CategoryDTO) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <Field label="Description" error={description !== "" ? errors.description : undefined}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputCls(errors.description && description !== "")} h-auto py-2`}
          />
        </Field>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="Price (USD)"
            error={price !== "" ? errors.price : undefined}
            hint="Stored as cents on the backend."
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls(errors.price && price !== "")}
            />
          </Field>

          <Field
            label="Original price (USD)"
            error={errors.originalPrice}
            hint="Optional — shown as struck-through when set."
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className={inputCls(errors.originalPrice)}
            />
          </Field>

          <Field label="Stock" error={errors.stock}>
            <input
              type="number"
              step="1"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputCls(errors.stock)}
            />
          </Field>
        </section>

        <div>
          <p className="mb-2 font-body text-[12px] font-medium text-heading">Images</p>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {mutation.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
            {mutation.error instanceof ApiClientError
              ? mutation.error.code === "CONFLICT"
                ? "A product with that slug already exists."
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
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="font-body text-[13px] text-muted hover:text-heading"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function inputCls(hasError: boolean | string | undefined): string {
  return `h-10 w-full rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,175,24,0.15)] ${
    hasError ? "border-red-400" : "border-border"
  }`;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 font-body text-[12px]">
      <span className="font-medium text-heading">{label}</span>
      {children}
      {error ? (
        <span className="text-[11px] text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
