"use client";

import { useState, useEffect } from "react";
import { useCartStore, selectItemCount } from "@/lib/cart-store";

export function CartBadge() {
  const [hydrated, setHydrated] = useState(false);
  const count = useCartStore(selectItemCount);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-heading">
      {count}
    </span>
  );
}
