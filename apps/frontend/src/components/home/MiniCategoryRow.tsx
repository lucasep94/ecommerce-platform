import Link from "next/link";
import type { CategoryDTO } from "@ecommerce/types";

export function MiniCategoryRow({ categories }: { categories: CategoryDTO[] }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-white px-6 py-4">
      <span className="shrink-0 font-body text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
        Browse
      </span>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="rounded-full bg-bg px-3.5 py-1 font-body text-[12px] text-text transition-colors hover:bg-accent hover:text-heading"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
