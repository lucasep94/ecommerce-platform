"use client";

import { useEffect } from "react";
import type { ProductDTO } from "@ecommerce/types";
import { useLastViewedStore } from "@/lib/last-viewed-store";

export function TrackLastViewed({ product }: { product: ProductDTO }) {
  const push = useLastViewedStore((s) => s.push);
  useEffect(() => {
    push(product);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
