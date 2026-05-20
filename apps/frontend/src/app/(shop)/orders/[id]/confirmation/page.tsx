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

export default function OrderConfirmationPage({ params }: PageProps) {
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
      <div className="mb-8 rounded-2xl border border-[#bce5bc] bg-[#ecf9ec] p-6">
        <p className="font-body text-[12px] font-bold uppercase tracking-[0.12em] text-[#2a7a2a]">
          Order placed
        </p>
        <h1 className="mt-2 font-heading text-[24px] font-bold text-heading">
          Thanks for your order
        </h1>
        <p className="mt-1 font-body text-[13px] text-text">
          We&apos;ve received your order. Payment processing will be enabled in Phase 4 —
          the order is currently in <code>PENDING</code> status.
        </p>
      </div>

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
                Order ID
              </p>
              <p className="font-heading text-[13px] font-semibold text-heading">{data.id}</p>
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

          <div className="mt-6 flex gap-3">
            <Link
              href="/orders"
              className="rounded-full border border-border px-5 py-2.5 font-body text-[13px] font-semibold text-heading hover:bg-border/30"
            >
              View all orders
            </Link>
            <Link
              href="/products"
              className="rounded-full bg-accent px-5 py-2.5 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
