"use client";

import { useWishlistStore } from "@/lib/wishlist-store";

export function WishlistButton({ productId }: { productId: string }) {
  const toggle = useWishlistStore((s) => s.toggle);
  // Select the boolean directly (not the `has` function) so Zustand re-renders
  // this button when `ids` changes. Selecting `s.has` returns a stable function
  // ref and the component would never update.
  const active = useWishlistStore((s) => s.ids.includes(productId));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggle(productId);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? "#fcaf18" : "none"} stroke={active ? "#fcaf18" : "#8a8a8d"} strokeWidth="1.8">
        <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" />
      </svg>
    </button>
  );
}
