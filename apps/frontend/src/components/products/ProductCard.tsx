import Image from "next/image";
import Link from "next/link";
import type { ProductDTO } from "@ecommerce/types";
import { formatPrice, calcSave } from "@/lib/format";
import { RatingStars } from "./RatingStars";
import { WishlistButton } from "./WishlistButton";

function getBadge(product: ProductDTO): string | null {
  if (product.originalPrice) {
    const pct = Math.round((1 - product.price / product.originalPrice) * 100);
    return `-${pct}%`;
  }
  const age = Date.now() - new Date(product.createdAt).getTime();
  if (age < 1000 * 60 * 60 * 24 * 14) return "New";
  if (product.rating && product.rating >= 4.7 && product.reviewCount >= 200) return "Best seller";
  return null;
}

export function ProductCard({ product }: { product: ProductDTO }) {
  const image = product.images[0];
  const badge = getBadge(product);
  const hasSave = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f5f5f7]">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-muted">
            no image
          </div>
        )}

        {badge && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-accent px-2 py-0.5 font-body text-[10px] font-bold text-heading">
            {badge}
          </span>
        )}

        <div className="absolute top-2.5 right-2.5">
          <WishlistButton productId={product.id} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 min-h-[38px] font-heading text-[13px] font-semibold leading-snug text-heading">
          {product.name}
        </h3>

        {product.rating !== null && (
          <div className="flex items-center gap-1.5">
            <RatingStars rating={product.rating} />
            <span className="font-body text-[11px] text-muted">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="font-heading text-[15px] font-bold text-heading">
            {formatPrice(product.price)}
          </span>
          {hasSave && (
            <>
              <span className="font-body text-[12px] text-muted line-through">
                {formatPrice(product.originalPrice!)}
              </span>
              <span className="rounded-full bg-[#ecf9ec] px-1.5 py-0.5 font-body text-[10px] font-bold text-[#2a7a2a]">
                Save ${calcSave(product.originalPrice!, product.price)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
