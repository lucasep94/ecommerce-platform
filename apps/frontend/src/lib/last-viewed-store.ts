"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDTO } from "@ecommerce/types";

const MAX = 8;

interface LastViewedState {
  products: ProductDTO[];
  push: (product: ProductDTO) => void;
}

export const useLastViewedStore = create<LastViewedState>()(
  persist(
    (set) => ({
      products: [],
      push: (product) =>
        set((s) => {
          const filtered = s.products.filter((p) => p.id !== product.id);
          return { products: [product, ...filtered].slice(0, MAX) };
        }),
    }),
    { name: "storely.last-viewed.v1" },
  ),
);
