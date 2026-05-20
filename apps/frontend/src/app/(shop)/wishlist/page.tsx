import type { Metadata } from "next";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = {
  title: "Your wishlist — Storely",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-10 py-10">
      <h1 className="mb-8 font-heading text-[28px] font-bold text-heading">Your wishlist</h1>
      <WishlistView />
    </div>
  );
}
