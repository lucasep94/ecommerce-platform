"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

/**
 * Sidebar nav for the admin panel. Highlights the section that matches
 * the current path. Client component so it can read `usePathname`; the
 * surrounding layout stays server-side for the role check.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border">
      <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Admin
      </p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 font-body text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white text-heading shadow-sm"
                  : "text-text hover:bg-white/60 hover:text-heading"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
