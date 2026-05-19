import Link from "next/link";
import type { CategoryDTO } from "@ecommerce/types";

interface Props {
  categories: CategoryDTO[];
  activeSlug?: string;
}

export function CategoryPills({ categories, activeSlug }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/products"
        className={`rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors ${
          !activeSlug
            ? "border-heading bg-heading text-white"
            : "border-border bg-white text-text hover:border-heading"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/products?category=${cat.slug}`}
          className={`rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors ${
            activeSlug === cat.slug
              ? "border-heading bg-heading text-white"
              : "border-border bg-white text-text hover:border-heading"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
