"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductDTO } from "@ecommerce/types";
import { listCategories } from "@/services/categories";
import { listProductsAdmin, restoreProduct, softDeleteProduct } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";

/**
 * Admin products list. Pulls a generous pageSize from the admin endpoint
 * (which already returns active + inactive) and filters/searches client-
 * side. This is fine while the catalog is small (< a few hundred). When
 * it grows past that, push these filters down to the backend.
 */
export default function AdminProductsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [showInactive, setShowInactive] = useState(true);

  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listProductsAdmin(token, { pageSize: 100 });
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const filtered = useMemo(() => {
    const items = productsQuery.data?.data ?? [];
    const needle = search.trim().toLowerCase();
    return items.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (needle && !p.name.toLowerCase().includes(needle) && !p.slug.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [productsQuery.data, search, categoryId, showInactive]);

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await softDeleteProduct(id, token);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await restoreProduct(id, token);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const mutationError = softDelete.error ?? restore.error;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-[24px] font-bold text-heading">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-accent px-5 py-2.5 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
        >
          + New product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <input
          type="text"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 min-w-48 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
        >
          <option value="">All categories</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 font-body text-[12px] text-text">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {mutationError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
          {mutationError instanceof ApiClientError
            ? `${mutationError.code}: ${mutationError.message}`
            : mutationError.message}
        </p>
      )}

      {productsQuery.isPending ? (
        <p className="font-body text-[14px] text-muted">Loading…</p>
      ) : productsQuery.error ? (
        <p className="font-body text-[14px] text-red-600">
          {productsQuery.error instanceof ApiClientError
            ? `${productsQuery.error.code}: ${productsQuery.error.message}`
            : productsQuery.error.message}
        </p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-[14px] text-muted">No products match the current filters.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg-warm">
              <tr>
                <Th>Product</Th>
                <Th>Brand</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: ProductDTO) => (
                <tr key={p.id} className="border-t border-border first:border-t-0">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f5f5f7]">
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-heading">{p.name}</p>
                        <p className="font-mono text-[11px] text-muted">{p.slug}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-text">{p.brand}</Td>
                  <Td className="text-right text-text">{formatPrice(p.price)}</Td>
                  <Td className={`text-right ${p.stock === 0 ? "text-red-500" : "text-text"}`}>
                    {p.stock}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider ${
                        p.isActive ? "bg-[#ecf9ec] text-[#2a7a2a]" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-body text-[12px] text-heading underline hover:text-accent"
                      >
                        Edit
                      </Link>
                      {p.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deactivate "${p.name}"? It won't appear in the storefront until restored.`,
                              )
                            ) {
                              softDelete.mutate(p.id);
                            }
                          }}
                          disabled={softDelete.isPending}
                          className="font-body text-[12px] text-red-600 underline hover:text-red-800 disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restore.mutate(p.id)}
                          disabled={restore.isPending}
                          className="font-body text-[12px] text-[#2a7a2a] underline hover:text-[#1f5e1f] disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 font-body text-[11px] font-bold uppercase tracking-wider text-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 font-body text-[13px] text-text ${className}`}>{children}</td>;
}
