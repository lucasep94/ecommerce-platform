import { listProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryPills } from "@/components/home/CategoryPills";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { LastViewed } from "@/components/home/LastViewed";
import { MiniCategoryRow } from "@/components/home/MiniCategoryRow";

export default async function Home() {
  const [categories, { data: topSellers }, { data: newest }] = await Promise.all([
    listCategories(),
    listProducts({ sort: "top", pageSize: 10 }),
    listProducts({ sort: "newest", pageSize: 10 }),
  ]);

  return (
    <div className="mx-auto max-w-[1360px] px-10 py-12 flex flex-col gap-14">
      <section>
        <CategoryPills categories={categories} />
      </section>

      <section>
        <div className="mb-5">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Explore</p>
          <h2 className="mt-1 font-heading text-[24px] font-bold text-heading">Shop by category</h2>
        </div>
        <ShopByCategory categories={categories} />
      </section>

      <section>
        <div className="mb-5">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Customer favourites</p>
          <h2 className="mt-1 font-heading text-[24px] font-bold text-heading">Top sellers</h2>
        </div>
        {topSellers.length > 0 ? (
          <ProductGrid products={topSellers} cols={5} />
        ) : (
          <p className="text-muted">No products available.</p>
        )}
      </section>

      <section>
        <div className="mb-5">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Just arrived</p>
          <h2 className="mt-1 font-heading text-[24px] font-bold text-heading">This must be for you</h2>
        </div>
        {newest.length > 0 ? (
          <ProductGrid products={newest} cols={5} />
        ) : (
          <p className="text-muted">No products available.</p>
        )}
      </section>

      <LastViewed />

      <MiniCategoryRow categories={categories} />
    </div>
  );
}
