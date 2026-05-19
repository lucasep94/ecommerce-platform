"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/services/orders";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";

export default function OrdersPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listOrders(token, { pageSize: 20 });
    },
    enabled: isLoaded && isSignedIn,
  });

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-12">
      <h1 className="mb-8 font-heading text-[28px] font-bold text-heading">Your orders</h1>

      {isPending ? (
        <p className="font-body text-[14px] text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-[14px] text-red-600">
          {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
        </p>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10">
          <p className="font-body text-[14px] text-text">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-white p-5 hover:border-accent"
            >
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 font-heading text-[14px] font-semibold text-heading">
                  Order {order.id.slice(0, 10)}…
                </p>
                <p className="mt-1 font-body text-[12px] text-text">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-bg-warm px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-heading">
                  {order.status}
                </span>
                <span className="font-heading text-[15px] font-bold text-heading">
                  {formatPrice(order.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
