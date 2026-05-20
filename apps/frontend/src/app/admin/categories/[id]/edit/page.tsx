"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/services/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The backend doesn't expose a `getCategoryById` endpoint (public API is
 * keyed by slug). Rather than add one for a single admin form, we fetch
 * the full categories list (small dataset, cached by TanStack Query for
 * the rest of the admin session) and pick the row we need. Trading one
 * extra row read for zero new backend surface.
 */
export default function EditCategoryPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  if (isPending) return <p className="font-body text-[14px] text-muted">Loading…</p>;
  if (error) {
    return (
      <p className="font-body text-[14px] text-red-600">
        Failed to load category: {error.message}
      </p>
    );
  }
  const category = data?.find((c) => c.id === id);
  if (!category) {
    return (
      <div>
        <p className="font-body text-[14px] text-text">Category not found.</p>
        <Link href="/admin/categories" className="mt-3 inline-block font-body text-[12px] underline">
          ← Back to categories
        </Link>
      </div>
    );
  }
  return <CategoryForm initial={category} />;
}
