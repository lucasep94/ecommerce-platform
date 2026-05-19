import type { ProductDTO } from "@ecommerce/types";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function ProductCardSkeleton({ product }: { product: ProductDTO }) {
  const image = product.images[0];
  return (
    <article className="group flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-2xl bg-[#f5f5f7]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-muted">
            no image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 min-h-[40px] font-heading text-[14px] font-medium text-heading">
          {product.name}
        </h3>
        <p className="font-body text-[15px] font-bold text-heading">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}
