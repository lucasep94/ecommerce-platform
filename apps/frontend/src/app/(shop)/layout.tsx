import { UtilityBar } from "@/components/shell/UtilityBar";
import { Navbar } from "@/components/shell/Navbar";
import { Footer } from "@/components/shell/Footer";
import { listCategories } from "@/services/categories";

/**
 * Storefront shell. Everything inside the `(shop)` route group renders
 * with the public navigation (utility bar, navbar, footer). The route
 * group `(shop)` is a no-op in the URL — `app/(shop)/page.tsx` is still
 * served at `/`. The point is to scope this layout so it does NOT wrap
 * the admin routes at `app/admin/*`.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await listCategories().catch(() => []);

  return (
    <>
      <UtilityBar />
      <Navbar categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
