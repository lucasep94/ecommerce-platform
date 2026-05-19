"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/cart-store";
import { computeCartTotals } from "@/lib/cart-totals";
import { getProductsByIds } from "@/services/products";
import { formatPrice } from "@/lib/format";

/**
 * Stock revalidation strategy: on mount, refetch the live products for every
 * id in the cart. We compare against the snapshot in the store and surface
 * warnings + clamp quantities. The backend remains the source of truth — the
 * checkout submit will still get a 409 if a race happens between this query
 * and the order creation.
 */
export function CartView() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => setHydrated(true), []);

  const ids = useMemo(() => items.map((i) => i.productId), [items]);

  const { data: live, isLoading: revalidating } = useQuery({
    queryKey: ["cart", "products-by-ids", ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
    staleTime: 30_000,
  });

  // Reconcile snapshot with live data: clamp quantities to live stock and
  // collect warnings to render. We mutate via setQuantity (single source of
  // truth) so subsequent re-renders pick up the clamp.
  const warnings = useMemo(() => {
    if (!live) return [];
    const map = new Map(live.map((p) => [p.id, p]));
    const out: { productId: string; kind: "out-of-stock" | "clamped" | "missing"; name: string }[] = [];
    for (const item of items) {
      const fresh = map.get(item.productId);
      if (!fresh) {
        out.push({ productId: item.productId, kind: "missing", name: item.name });
        continue;
      }
      if (fresh.stock <= 0) {
        out.push({ productId: item.productId, kind: "out-of-stock", name: item.name });
      } else if (fresh.stock < item.quantity) {
        out.push({ productId: item.productId, kind: "clamped", name: item.name });
      }
    }
    return out;
  }, [live, items]);

  useEffect(() => {
    if (!live) return;
    const map = new Map(live.map((p) => [p.id, p]));
    for (const item of items) {
      const fresh = map.get(item.productId);
      if (!fresh) {
        // Product was deactivated or deleted — drop it from the cart.
        removeItem(item.productId);
        continue;
      }
      if (fresh.stock < item.quantity) {
        setQuantity(item.productId, fresh.stock);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  if (!hydrated) {
    return <p className="font-body text-[14px] text-muted">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-white p-10">
        <p className="font-body text-[14px] text-text">Your cart is empty.</p>
        <Link
          href="/products"
          className="rounded-full bg-accent px-6 py-3 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const totals = computeCartTotals(items);
  const hasBlockingIssue = items.some((i) => i.quantity <= 0 || i.stock <= 0);

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        {warnings.length > 0 && (
          <ul className="rounded-2xl border border-orange-200 bg-orange-50 p-4 font-body text-[13px] text-orange-800">
            {warnings.map((w) => (
              <li key={w.productId}>
                {w.kind === "out-of-stock" && <>“{w.name}” is now out of stock.</>}
                {w.kind === "clamped" && (
                  <>“{w.name}” has less stock than you requested — quantity adjusted.</>
                )}
                {w.kind === "missing" && (
                  <>“{w.name}” is no longer available and was removed from your cart.</>
                )}
              </li>
            ))}
          </ul>
        )}

        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-border bg-white p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7]">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                {item.brand}
              </p>
              <Link
                href={`/products/${item.slug}`}
                className="font-heading text-[14px] font-semibold text-heading hover:underline"
              >
                {item.name}
              </Link>
              <p className="font-heading text-[14px] font-bold text-heading">
                {formatPrice(item.price)}
              </p>
              {item.stock <= 0 && (
                <p className="font-body text-[12px] font-medium text-red-500">Out of stock</p>
              )}
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="font-body text-[12px] text-muted underline hover:text-heading"
              >
                Remove
              </button>
              <div className="flex h-9 items-center rounded-full border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  aria-label="Decrease"
                  className="flex h-full w-8 items-center justify-center text-heading"
                >
                  −
                </button>
                <span className="w-7 text-center font-body text-[13px] font-semibold text-heading">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  aria-label="Increase"
                  className="flex h-full w-8 items-center justify-center text-heading disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <p className="font-body text-[13px] font-semibold text-heading">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 font-heading text-[16px] font-bold text-heading">Order summary</h2>
        <dl className="flex flex-col gap-2 font-body text-[13px] text-text">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="text-muted">Free</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd className="text-muted">Calculated at next phase</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-3 font-heading text-[15px] font-bold text-heading">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          aria-disabled={hasBlockingIssue}
          className={`mt-6 flex w-full items-center justify-center rounded-full bg-accent py-3.5 font-body text-[14px] font-bold text-heading hover:bg-[#ffbe3a] ${
            hasBlockingIssue ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Proceed to checkout
        </Link>
        {revalidating && (
          <p className="mt-3 text-center font-body text-[11px] text-muted">
            Checking stock…
          </p>
        )}
      </aside>
    </div>
  );
}
