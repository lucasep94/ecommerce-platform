"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { listProductsAdmin } from "@/services/admin";
import { ProductForm } from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Same pattern as the categories edit page: the public API is keyed by
 * slug and the admin list endpoint returns id-keyed rows, so we reuse the
 * cached admin products query (loaded by the list page upstream) and pick
 * the row by id. No extra `GET /products/admin/:id` endpoint needed.
 */
export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listProductsAdmin(token, { pageSize: 100 });
    },
  });

  if (isPending) return <p className="font-body text-[14px] text-muted">Loading…</p>;
  if (error) {
    return (
      <p className="font-body text-[14px] text-red-600">Failed to load: {error.message}</p>
    );
  }
  const product = data?.data.find((p) => p.id === id);
  if (!product) {
    return (
      <div>
        <p className="font-body text-[14px] text-text">Product not found.</p>
        <Link href="/admin/products" className="mt-3 inline-block font-body text-[12px] underline">
          ← Back to products
        </Link>
      </div>
    );
  }
  return <ProductForm initial={product} />;
}
