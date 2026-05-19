"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import type { CategoryDTO } from "@ecommerce/types";
import { CategoriesDropdown } from "./CategoriesDropdown";
import { WishlistBadge } from "./WishlistBadge";
import { CartBadge } from "./CartBadge";

export function Navbar({ categories }: { categories: CategoryDTO[] }) {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex h-20 max-w-[1360px] items-center gap-8 px-10">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-heading text-2xl font-bold text-heading">storely</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>

        <form
          action="/products"
          method="get"
          className="relative flex h-12 flex-1 items-center rounded-full border border-border bg-white focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(252,175,24,0.12)]"
        >
          <CategoriesDropdown categories={categories} />
          <input
            name="search"
            type="text"
            placeholder="Search products, brands, categories…"
            className="h-full flex-1 bg-transparent px-4 text-[14px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="m-1 h-10 rounded-full bg-accent px-6 font-body text-[13px] font-bold text-heading transition-colors hover:bg-[#ffbe3a]"
          >
            Search
          </button>
        </form>

        <nav className="flex items-center gap-2">
          {isLoaded && isSignedIn ? (
            <Link
              href="/account"
              className="flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-heading hover:bg-border/50"
            >
              <UserIcon />
              <span>Account</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-heading hover:bg-border/50"
            >
              <UserIcon />
              <span>Sign in</span>
            </Link>
          )}
          <Link
            href="/wishlist"
            className="relative flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-heading hover:bg-border/50"
          >
            <HeartIcon />
            <span>Wishlist</span>
            <WishlistBadge />
          </Link>
          <Link
            href="/cart"
            className="relative flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-heading hover:bg-border/50"
          >
            <CartIcon />
            <span>Cart</span>
            <CartBadge />
          </Link>
          {isLoaded && isSignedIn ? (
            <div className="ml-2">
              <UserButton />
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}
