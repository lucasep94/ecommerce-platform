"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "@ecommerce/types";
import { listOrdersAdmin } from "@/services/admin";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Server-side filters: status + search are applied by the backend so we
  // can paginate properly even when the dataset grows.
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "orders", { status, search, page }],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listOrdersAdmin(token, {
        page,
        pageSize,
        status: status || undefined,
        search: search.trim() || undefined,
      });
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[24px] font-bold text-heading">Orders</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <input
          type="text"
          placeholder="Search by order id, buyer email or name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 flex-1 min-w-72 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <p className="font-body text-[14px] text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-[14px] text-red-600">
          {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
        </p>
      ) : !data || data.data.length === 0 ? (
        <p className="font-body text-[14px] text-muted">No orders match the current filters.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-bg-warm">
                <tr>
                  <Th>Date</Th>
                  <Th>Order ID</Th>
                  <Th>Buyer</Th>
                  <Th className="text-right">Items</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((order) => (
                  <tr key={order.id} className="border-t border-border first:border-t-0">
                    <Td className="text-text">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[12px] text-heading underline hover:text-accent"
                      >
                        {order.id.slice(0, 12)}…
                      </Link>
                    </Td>
                    <Td>
                      <p className="font-medium text-heading">{order.user.name}</p>
                      <p className="font-body text-[11px] text-muted">{order.user.email}</p>
                    </Td>
                    <Td className="text-right text-text">{order.items.length}</Td>
                    <Td className="text-right font-semibold text-heading">
                      {formatPrice(order.total)}
                    </Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between font-body text-[12px] text-text">
              <span>
                Page {data.page} of {totalPages} · {data.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-full border border-border px-3 py-1 hover:bg-bg-warm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-full border border-border px-3 py-1 hover:bg-bg-warm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PENDING: "bg-bg-warm text-heading",
    PAID: "bg-[#ecf9ec] text-[#2a7a2a]",
    SHIPPED: "bg-blue-50 text-blue-700",
    DELIVERED: "bg-[#ecf9ec] text-[#2a7a2a]",
    CANCELLED: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
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
  return <td className={`px-4 py-3 font-body text-[13px] ${className}`}>{children}</td>;
}
