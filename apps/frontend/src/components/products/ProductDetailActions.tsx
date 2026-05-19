"use client";

import { useState } from "react";
import type { ProductDTO } from "@ecommerce/types";
import { AddToCartButton } from "./AddToCartButton";

/**
 * Detail-page actions: quantity selector + primary Add-to-cart button.
 * Quantity is clamped to [1, stock] on the client; the cart store re-clamps
 * on add (defense in depth in case stock changed between SSR and click).
 */
export function ProductDetailActions({ product }: { product: ProductDTO }) {
  const max = Math.max(1, product.stock);
  const [qty, setQty] = useState(1);
  const disabled = product.stock <= 0;

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(max, q + 1));

  return (
    <div className="flex flex-1 items-end gap-3">
      <div className="flex h-12 items-center rounded-full border border-border">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || qty <= 1}
          aria-label="Decrease quantity"
          className="flex h-full w-10 items-center justify-center text-heading disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center font-body text-[14px] font-semibold text-heading">
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={disabled || qty >= max}
          aria-label="Increase quantity"
          className="flex h-full w-10 items-center justify-center text-heading disabled:opacity-30"
        >
          +
        </button>
      </div>
      <AddToCartButton product={product} quantity={qty} variant="detail" />
    </div>
  );
}
