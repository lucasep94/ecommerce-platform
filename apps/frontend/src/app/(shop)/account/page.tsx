"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/auth";
import { ApiClientError } from "@/services/api-client";

export default function AccountPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const token = await getToken();
      return getMe(token);
    },
    enabled: isLoaded && isSignedIn,
  });

  return (
    <div className="mx-auto max-w-[1360px] px-10 py-12">
      <div className="mb-7">
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Account</p>
        <h1 className="mt-1 font-heading text-[32px] font-bold text-heading">Your profile</h1>
      </div>

      {isPending ? (
        <p className="text-text">Loading your profile…</p>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="font-heading text-[16px] font-semibold text-heading">
            Couldn&apos;t load your profile
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {error instanceof ApiClientError ? `${error.code}: ${error.message}` : error.message}
          </p>
        </div>
      ) : data ? (
        <dl className="grid max-w-md grid-cols-[120px_1fr] gap-y-4 rounded-2xl border border-border bg-white p-6">
          <dt className="text-[12px] uppercase tracking-wider text-muted">Name</dt>
          <dd className="font-heading text-[14px] text-heading">{data.name}</dd>
          <dt className="text-[12px] uppercase tracking-wider text-muted">Email</dt>
          <dd className="font-body text-[14px] text-text">{data.email}</dd>
          <dt className="text-[12px] uppercase tracking-wider text-muted">Role</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-bg-warm px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-heading">
              {data.role}
            </span>
          </dd>
          <dt className="text-[12px] uppercase tracking-wider text-muted">Member since</dt>
          <dd className="font-body text-[14px] text-text">
            {new Date(data.createdAt).toLocaleDateString()}
          </dd>
        </dl>
      ) : null}

      <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
        <Link
          href="/orders"
          className="rounded-2xl border border-border bg-white p-5 hover:border-accent"
        >
          <p className="font-heading text-[14px] font-semibold text-heading">Your orders</p>
          <p className="mt-1 font-body text-[12px] text-muted">View order history and status</p>
        </Link>
        <Link
          href="/wishlist"
          className="rounded-2xl border border-border bg-white p-5 hover:border-accent"
        >
          <p className="font-heading text-[14px] font-semibold text-heading">Wishlist</p>
          <p className="mt-1 font-body text-[12px] text-muted">Items you saved for later</p>
        </Link>
        {data?.role === "ADMIN" && (
          // The admin layout also enforces the role check server-side, so
          // this is a UI affordance, not a gate. Non-admins simply never
          // see the tile because `data.role` is `CUSTOMER`.
          <Link
            href="/admin"
            className="col-span-2 rounded-2xl border border-accent bg-bg-warm p-5 hover:bg-[#fff3d6]"
          >
            <p className="font-heading text-[14px] font-semibold text-heading">Admin panel</p>
            <p className="mt-1 font-body text-[12px] text-muted">
              Manage products, categories and orders
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
