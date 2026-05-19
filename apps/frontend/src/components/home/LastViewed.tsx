"use client";

import { useState, useEffect } from "react";
import { useLastViewedStore } from "@/lib/last-viewed-store";
import { ProductCard } from "@/components/products/ProductCard";

export function LastViewed() {
  const [hydrated, setHydrated] = useState(false);
  const products = useLastViewedStore((s) => s.products);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || products.length === 0) return null;

  return (
    <section>
      <div className="mb-5">
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Your history</p>
        <h2 className="mt-1 font-heading text-[24px] font-bold text-heading">Recently viewed</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-44 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
