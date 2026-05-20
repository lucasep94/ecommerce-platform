"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useWishlistStore } from "@/lib/wishlist-store";
import { getProductsByIds } from "@/services/products";
import { ProductGrid } from "@/components/products/ProductGrid";

/**
 * Wishlist lives entirely client-side (Zustand + localStorage); the page
 * hydrates the ids from the store and fetches full ProductDTOs in one batch
 * via the same /products?ids=... endpoint the cart uses. Products that no
 * longer exist (or were deactivated) simply drop out — no need to prune the
 * store, since `has` / `toggle` still work against the raw id list.
 */
export function WishlistView() {
  const [hydrated, setHydrated] = useState(false);
  const ids = useWishlistStore((s) => s.ids);

  useEffect(() => setHydrated(true), []);

  const { data, isPending } = useQuery({
    queryKey: ["wishlist", "products-by-ids", ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
    staleTime: 30_000,
  });

  const visible = useMemo(() => data ?? [], [data]);

  if (!hydrated) {
    return <p className="font-body text-[14px] text-muted">Loading wishlist…</p>;
  }

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-white p-10">
        <p className="font-body text-[14px] text-text">
          You haven&apos;t saved any items yet.
        </p>
        <Link
          href="/products"
          className="rounded-full bg-accent px-6 py-3 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  if (isPending) {
    return <p className="font-body text-[14px] text-muted">Loading items…</p>;
  }

  if (visible.length === 0) {
    return (
      <p className="font-body text-[14px] text-muted">
        None of your saved items are available anymore.
      </p>
    );
  }

  return <ProductGrid products={visible} cols={4} />;
}
