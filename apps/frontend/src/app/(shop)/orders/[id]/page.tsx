"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/services/orders";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrder(id, token);
    },
    enabled: isLoaded && isSignedIn,
  });

  return (
    <div className="mx-auto max-w-[800px] px-10 py-12">
      <Link
        href="/orders"
        className="mb-6 inline-block font-body text-[12px] text-muted hover:text-heading"
      >
        ← Back to orders
      </Link>

      {isPending ? (
        <p className="font-body text-[14px] text-muted">Loading order…</p>
      ) : error ? (
        <p className="font-body text-[14px] text-red-600">
          {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
        </p>
      ) : data ? (
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">
                Order
              </p>
              <p className="font-heading text-[16px] font-bold text-heading">{data.id}</p>
              <p className="mt-1 font-body text-[12px] text-muted">
                Placed {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="rounded-full bg-bg-warm px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-heading">
              {data.status}
            </span>
          </div>

          <ul className="my-4 flex flex-col gap-2">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between font-body text-[13px] text-text"
              >
                <span>
                  Item × {item.quantity}{" "}
                  <span className="text-muted">({item.productId.slice(0, 8)}…)</span>
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
      ) : null}
    </div>
  );
}
