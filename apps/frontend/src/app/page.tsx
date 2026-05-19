import { listProducts } from "@/services/products";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";

export default async function Home() {
  const { data: products } = await listProducts({ pageSize: 8 });

  return (
    <div className="mx-auto max-w-[1360px] px-10 py-12">
      <div className="mb-7">
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Featured</p>
        <h2 className="mt-1 font-heading text-[32px] font-bold text-heading">Latest products</h2>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-bg-warm p-12 text-center">
          <p className="font-heading text-[18px] text-heading">No products yet.</p>
          <p className="mt-1 text-[13px] text-muted">
            Run the seed script in <code className="font-mono">packages/database</code> to populate the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCardSkeleton key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
