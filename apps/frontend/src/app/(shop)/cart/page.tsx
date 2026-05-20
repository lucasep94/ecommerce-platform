import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = {
  title: "Your cart — Storely",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-10 py-10">
      <h1 className="mb-8 font-heading text-[28px] font-bold text-heading">Your cart</h1>
      <CartView />
    </div>
  );
}
