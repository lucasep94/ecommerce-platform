"use client";

import { useState } from "react";
import type { ProductDTO } from "@ecommerce/types";
import { useCartStore } from "@/lib/cart-store";

interface Props {
  product: ProductDTO;
  quantity?: number;
  /** "card" = compact icon overlay, "detail" = full primary button. */
  variant?: "card" | "detail";
}

/**
 * Card variant lives inside an outer <Link>, so it must stopPropagation +
 * preventDefault — otherwise clicking the button would also navigate to the
 * product detail page.
 */
export function AddToCartButton({ product, quantity = 1, variant = "card" }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const disabled = product.stock <= 0;

  const handleClick = (e: React.MouseEvent) => {
    if (variant === "card") {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={disabled ? "Out of stock" : "Add to cart"}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
      >
        {justAdded ? <CheckIcon /> : <PlusIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex-1 rounded-full bg-accent py-3.5 font-body text-[14px] font-bold text-heading transition-colors hover:bg-[#ffbe3a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
    >
      {disabled ? "Out of stock" : justAdded ? "Added to cart ✓" : "Add to cart"}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
