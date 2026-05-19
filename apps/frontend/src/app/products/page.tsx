import type { Metadata } from "next";
import { listProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { Pagination } from "@/components/products/Pagination";
import type { SortOption } from "@/services/products";

export const metadata: Metadata = {
  title: "All products — Storely",
  description: "Browse our full catalog of curated products.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category;
  const search = params.search;
  const sort = params.sort as SortOption | undefined;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;

  const [{ data: products, total }, categories] = await Promise.all([
    listProducts({ category, search, sort, page, pageSize }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-[1360px] px-10 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-[28px] font-bold text-heading">
          {category
            ? (categories.find((c) => c.slug === category)?.name ?? "Products")
            : "All products"}
        </h1>
        {total > 0 && (
          <p className="mt-1 font-body text-[13px] text-muted">{total} results</p>
        )}
      </div>

      <div className="mb-7">
        <ProductFilters
          categories={categories}
          activeCategory={category}
          activeSort={sort}
          search={search}
        />
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-bg-warm p-12 text-center">
          <p className="font-heading text-[18px] text-heading">No products found.</p>
          <p className="mt-1 text-[13px] text-muted">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <ProductGrid products={products} cols={4} />
          <Pagination page={page} total={total} pageSize={pageSize} searchParams={params} />
        </div>
      )}
    </div>
  );
}
