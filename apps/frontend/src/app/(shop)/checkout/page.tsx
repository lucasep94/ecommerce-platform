import type { Metadata } from "next";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = {
  title: "Checkout — Storely",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-10 py-10">
      <h1 className="mb-2 font-heading text-[28px] font-bold text-heading">Checkout</h1>
      <p className="mb-8 font-body text-[13px] text-muted">
        Payment is deferred to Phase 4 — orders are placed in <code>PENDING</code> status.
      </p>
      <CheckoutView />
    </div>
  );
}
