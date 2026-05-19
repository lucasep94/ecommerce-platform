"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { CategoryDTO } from "@ecommerce/types";

export function CategoriesDropdown({ categories }: { categories: CategoryDTO[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-full items-center gap-1 border-r border-border px-4 text-[13px] text-text hover:text-heading"
      >
        All categories{" "}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-[13px] text-text hover:bg-bg hover:text-heading"
            >
              <span>{cat.name}</span>
              <span className="text-[11px] text-muted">{cat.productCount}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
