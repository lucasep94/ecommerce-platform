"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/services/categories";
import { deleteCategory } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";

export default function AdminCategoriesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteCategory(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-[24px] font-bold text-heading">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-accent px-5 py-2.5 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
        >
          + New category
        </Link>
      </div>

      {del.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
          {del.error instanceof ApiClientError
            ? del.error.code === "CONFLICT"
              ? "Can't delete this category — it still has products. Move them to another category first."
              : `${del.error.code}: ${del.error.message}`
            : del.error.message}
        </p>
      )}

      {isPending ? (
        <p className="font-body text-[14px] text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-[14px] text-red-600">
          {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
        </p>
      ) : !data || data.length === 0 ? (
        <p className="font-body text-[14px] text-muted">No categories yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg-warm">
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th className="text-right">Products</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((cat) => (
                <tr key={cat.id} className="border-t border-border first:border-t-0">
                  <Td className="font-medium text-heading">{cat.name}</Td>
                  <Td className="text-muted">{cat.slug}</Td>
                  <Td className="text-right">{cat.productCount}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="font-body text-[12px] text-heading underline hover:text-accent"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete category "${cat.name}"? This is permanent.`,
                            )
                          ) {
                            del.mutate(cat.id);
                          }
                        }}
                        disabled={del.isPending}
                        className="font-body text-[12px] text-red-600 underline hover:text-red-800 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
