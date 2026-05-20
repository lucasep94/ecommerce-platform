import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getMe } from "@/services/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin shell. Lives outside the `(shop)` route group so it does NOT
 * inherit the storefront chrome — instead it gets its own minimal top
 * bar + sidebar, with a distinct color (`bg-bg-warm`) so an admin can
 * tell at a glance they're in the dashboard, not the public store.
 *
 * Server-side role check: middleware ensures a Clerk session; here we
 * enforce ADMIN role by calling our own `/auth/me` (which is the source
 * of truth for `role`, not Clerk metadata). Non-admins are bounced to
 * the storefront. Every admin API endpoint also requires `requireRole`
 * for defense in depth.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect("/sign-in?redirect_url=/admin");

  let me;
  try {
    me = await getMe(token);
  } catch {
    redirect("/");
  }
  if (me.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col ">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-10">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-heading text-[18px] font-bold text-heading">storely</span>
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-body text-[12px] text-muted hover:text-heading"
            >
              View storefront ↗
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1360px] flex-1 gap-8 px-10 py-8">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
