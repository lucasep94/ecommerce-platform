"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@ecommerce/types";
import { getOrderAdmin, updateOrderStatus } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrderAdmin(id, token);
    },
  });

  const mutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateOrderStatus(id, status, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "orders", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"], exact: false });
      setDraftStatus(null);
    },
  });

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="mb-6 inline-block font-body text-[12px] text-muted hover:text-heading"
      >
        ← Back to orders
      </Link>

      {isPending ? (
        <p className="font-body text-[14px] text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-[14px] text-red-600">
          {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
        </p>
      ) : data ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">Order</p>
                <p className="font-mono text-[14px] font-semibold text-heading">{data.id}</p>
                <p className="mt-1 font-body text-[12px] text-muted">
                  Placed {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">Buyer</p>
                <p className="font-medium text-heading">{data.user.name}</p>
                <p className="font-body text-[12px] text-muted">{data.user.email}</p>
              </div>
            </div>

            <ul className="my-4 flex flex-col gap-2">
              {data.items.map((item) => (
                <li key={item.id} className="flex justify-between font-body text-[13px] text-text">
                  <span>
                    Item × {item.quantity}{" "}
                    <span className="font-mono text-muted">({item.productId.slice(0, 8)}…)</span>
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between border-t border-border pt-4 font-heading text-[15px] font-bold text-heading">
              <span>Total</span>
              <span>{formatPrice(data.total)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="mb-3 font-heading text-[14px] font-bold text-heading">Status</p>
            <div className="flex items-center gap-3">
              <select
                value={draftStatus ?? data.status}
                onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
                disabled={mutation.isPending}
                className="h-10 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => draftStatus && mutation.mutate(draftStatus)}
                disabled={
                  !draftStatus || draftStatus === data.status || mutation.isPending
                }
                className="rounded-full bg-accent px-5 py-2 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Saving…" : "Update"}
              </button>
              {draftStatus && draftStatus !== data.status && (
                <button
                  type="button"
                  onClick={() => setDraftStatus(null)}
                  className="font-body text-[12px] text-muted hover:text-heading"
                >
                  Cancel
                </button>
              )}
            </div>
            {mutation.error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
                {mutation.error instanceof ApiClientError
                  ? `${mutation.error.code}: ${mutation.error.message}`
                  : mutation.error.message}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
