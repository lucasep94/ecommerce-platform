"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItemDTO, ProductDTO } from "@ecommerce/types";

interface CartState {
  items: CartItemDTO[];
  /** Adds qty to the existing line or creates a new one. Clamps to product stock. */
  addItem: (product: ProductDTO, qty?: number) => void;
  /** Sets the absolute quantity for a line; removes the line if qty <= 0. */
  setQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

/**
 * Snapshot the fields the cart UI needs from a ProductDTO. `stock` is the
 * snapshot at the moment of add — the cart page revalidates against the
 * backend on mount and the backend is the final authority at checkout.
 */
function snapshot(product: ProductDTO, quantity: number): CartItemDTO {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.images[0] ?? null,
    price: product.price,
    quantity,
    stock: product.stock,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, qty = 1) =>
        set((state) => {
          if (product.stock <= 0) return state;
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            const next = Math.min(existing.quantity + qty, product.stock);
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: next, stock: product.stock, price: product.price }
                  : i,
              ),
            };
          }
          const clamped = Math.min(Math.max(qty, 1), product.stock);
          return { items: [...state.items, snapshot(product, clamped)] };
        }),
      setQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(qty, i.stock) }
                : i,
            ),
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "storely.cart.v1" },
  ),
);

/** Derived selectors. Use these instead of inline computations in components. */
export const selectItemCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
