import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, listProducts } from "@/services/products";
import { ProductGallery } from "@/components/products/ProductGallery";
import { RatingStars } from "@/components/products/RatingStars";
import { WishlistButton } from "@/components/products/WishlistButton";
import { ProductDetailActions } from "@/components/products/ProductDetailActions";
import { ProductGrid } from "@/components/products/ProductGrid";
import { TrackLastViewed } from "@/components/products/TrackLastViewed";
import { formatPrice, calcSave } from "@/lib/format";
import { ApiClientError } from "@/services/api-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    return {
      title: `${product.name} — Storely`,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: product.images.slice(0, 1).map((url) => ({ url })),
      },
    };
  } catch {
    return { title: "Product not found — Storely" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const { data: related } = await listProducts({
    category: product.categoryId,
    pageSize: 5,
  }).catch(() => ({ data: [] }));
  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 4);

  const hasSave = product.originalPrice && product.originalPrice > product.price;
  const stockLabel =
    product.stock === 0
      ? "Out of stock"
      : product.stock <= 5
        ? `Only ${product.stock} left`
        : `In stock — ${product.stock} available`;

  return (
    <div className="mx-auto max-w-[1360px] px-10 py-10">
      <TrackLastViewed product={product} />

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {product.brand}
            </p>
            <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight text-heading">
              {product.name}
            </h1>
          </div>

          {product.rating !== null && (
            <div className="flex items-center gap-2">
              <RatingStars rating={product.rating} />
              <span className="font-body text-[13px] font-semibold text-heading">
                {product.rating.toFixed(1)}
              </span>
              <span className="font-body text-[13px] text-muted">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-[28px] font-bold text-heading">
              {formatPrice(product.price)}
            </span>
            {hasSave && (
              <>
                <span className="font-body text-[16px] text-muted line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
                <span className="rounded-full bg-[#ecf9ec] px-2.5 py-1 font-body text-[12px] font-bold text-[#2a7a2a]">
                  Save ${calcSave(product.originalPrice!, product.price)}
                </span>
              </>
            )}
          </div>

          <p className="font-body text-[14px] leading-relaxed text-text">{product.description}</p>

          <p
            className={`font-body text-[13px] font-medium ${
              product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-[#2a7a2a]"
            }`}
          >
            {stockLabel}
          </p>

          <div className="flex items-end gap-3">
            <ProductDetailActions product={product} />
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border">
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>

      {relatedFiltered.length > 0 && (
        <div className="mt-16">
          <div className="mb-6">
            <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">More like this</p>
            <h2 className="mt-1 font-heading text-[22px] font-bold text-heading">Related products</h2>
          </div>
          <ProductGrid products={relatedFiltered} cols={4} />
        </div>
      )}
    </div>
  );
}
