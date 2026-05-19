"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/cart-store";
import { computeCartTotals } from "@/lib/cart-totals";
import { getProductsByIds } from "@/services/products";
import { createOrder } from "@/services/orders";
import { ApiClientError } from "@/services/api-client";
import { formatPrice } from "@/lib/format";
import { confirmPayment } from "@/lib/payment-stub";

interface AddressForm {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
};

type FieldErrors = Partial<Record<keyof AddressForm, string>>;

/** Inline validator — Zod isn't a frontend dep and these rules are trivial. */
function validate(form: AddressForm): FieldErrors {
  const errors: FieldErrors = {};
  if (form.fullName.trim().length < 2) errors.fullName = "Required";
  if (form.line1.trim().length < 3) errors.line1 = "Required";
  if (form.city.trim().length < 2) errors.city = "Required";
  if (form.postalCode.trim().length < 3) errors.postalCode = "Required";
  if (form.country.trim().length < 2) errors.country = "Required";
  return errors;
}

export function CheckoutView() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  // Idempotency key: stable across rerenders for a given checkout mount.
  // A double-click on "Place order" sends the same header, and the backend
  // returns the same order on the second call.
  const idempotencyKeyRef = useRef<string | null>(null);
  if (idempotencyKeyRef.current === null) {
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressForm, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);

  // Empty cart on mount → bounce to /cart. The `placedOrderRef` flag short-
  // circuits the bounce once `onSubmit` has succeeded and called clearCart() —
  // otherwise the resulting items.length === 0 state would race the
  // router.push to the confirmation page and the user lands on /cart instead.
  const placedOrderRef = useRef(false);
  useEffect(() => {
    if (!hydrated || placedOrderRef.current) return;
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  const ids = useMemo(() => items.map((i) => i.productId), [items]);
  const { data: live } = useQuery({
    queryKey: ["cart", "products-by-ids", ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
    staleTime: 30_000,
  });

  const errors = validate(form);
  const formValid = Object.keys(errors).length === 0;
  const totals = computeCartTotals(items);

  function setField<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      line1: true,
      city: true,
      postalCode: true,
      country: true,
    });
    if (!formValid || submitting) return;

    // Pre-flight stock revalidation against the most recent fetch. The
    // backend is still authoritative — this catches the common case before
    // the user hits a 409.
    if (live) {
      const map = new Map(live.map((p) => [p.id, p]));
      for (const item of items) {
        const fresh = map.get(item.productId);
        if (!fresh || fresh.stock < item.quantity) {
          setSubmitError("Stock changed for one of your items. Please review your cart.");
          router.push("/cart");
          return;
        }
      }
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const order = await createOrder(
        { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
        { token, idempotencyKey: idempotencyKeyRef.current! },
      );

      // Stripe stub — no-op today. Phase 4 swaps this for Stripe Elements
      // confirming a PaymentIntent against `order.stripePaymentId`.
      await confirmPayment(order);

      // Set the flag BEFORE clearing the cart so the bounce effect skips this
      // tick. Order matters: clearCart triggers a re-render that runs the
      // effect synchronously, and we need the flag to already be true.
      placedOrderRef.current = true;
      clearCart();
      router.push(`/orders/${order.id}/confirmation`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "CONFLICT") {
          setSubmitError("Stock changed for one of your items. Please review your cart.");
          router.push("/cart");
          return;
        }
        if (err.code === "UNAUTHORIZED") {
          router.push("/sign-in?redirect_url=/checkout");
          return;
        }
        setSubmitError(`${err.code}: ${err.message}`);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      }
      setSubmitting(false);
    }
  }

  if (!hydrated || !isLoaded) {
    return <p className="font-body text-[14px] text-muted">Loading checkout…</p>;
  }

  if (!isSignedIn) {
    return (
      <p className="font-body text-[14px] text-text">
        Please <Link href="/sign-in?redirect_url=/checkout" className="underline">sign in</Link> to continue.
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="font-body text-[14px] text-muted">Redirecting to your cart…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 font-heading text-[16px] font-bold text-heading">Shipping address</h2>
          <p className="mb-5 rounded-lg bg-bg-warm px-3 py-2 font-body text-[12px] text-muted">
            Heads up: addresses aren&apos;t stored in this MVP. A proper Address model lands in Phase 9.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={(v) => setField("fullName", v)}
              onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              error={touched.fullName ? errors.fullName : undefined}
              className="md:col-span-2"
            />
            <Field
              label="Address line 1"
              value={form.line1}
              onChange={(v) => setField("line1", v)}
              onBlur={() => setTouched((t) => ({ ...t, line1: true }))}
              error={touched.line1 ? errors.line1 : undefined}
              className="md:col-span-2"
            />
            <Field
              label="Address line 2 (optional)"
              value={form.line2}
              onChange={(v) => setField("line2", v)}
              className="md:col-span-2"
            />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => setField("city", v)}
              onBlur={() => setTouched((t) => ({ ...t, city: true }))}
              error={touched.city ? errors.city : undefined}
            />
            <Field
              label="Postal code"
              value={form.postalCode}
              onChange={(v) => setField("postalCode", v)}
              onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
              error={touched.postalCode ? errors.postalCode : undefined}
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(v) => setField("country", v)}
              onBlur={() => setTouched((t) => ({ ...t, country: true }))}
              error={touched.country ? errors.country : undefined}
            />
            <Field
              label="Phone (optional)"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
            />
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 font-heading text-[16px] font-bold text-heading">Order summary</h2>
        <ul className="mb-4 flex flex-col gap-2 font-body text-[12px] text-text">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span className="truncate pr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border pt-3 font-body text-[13px] text-text">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="text-muted">Free</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd className="text-muted">Calculated at next phase</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-3 font-heading text-[15px] font-bold text-heading">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        {submitError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !formValid}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-accent py-3.5 font-body text-[14px] font-bold text-heading hover:bg-[#ffbe3a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
}

function Field({ label, value, onChange, onBlur, error, className }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1 font-body text-[12px] ${className ?? ""}`}>
      <span className="font-medium text-heading">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,175,24,0.15)] ${
          error ? "border-red-400" : "border-border"
        }`}
      />
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </label>
  );
}
