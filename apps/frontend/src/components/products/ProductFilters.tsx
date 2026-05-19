import Link from "next/link";
import type { CategoryDTO } from "@ecommerce/types";

interface Props {
  categories: CategoryDTO[];
  activeCategory?: string;
  activeSort?: string;
  search?: string;
}

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "top", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function ProductFilters({ categories, activeCategory, activeSort, search }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <form action="/products" method="get" className="flex gap-2">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <input
          name="search"
          defaultValue={search}
          placeholder="Search products…"
          className="h-10 flex-1 rounded-full border border-border bg-white px-4 text-[13px] outline-none focus:border-accent"
        />
        <select
          name="sort"
          defaultValue={activeSort ?? ""}
          className="h-10 rounded-full border border-border bg-white px-3 text-[13px] outline-none focus:border-accent"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-full bg-accent px-5 font-body text-[13px] font-bold text-heading hover:bg-[#ffbe3a]"
        >
          Apply
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full border px-3.5 py-1 text-[12px] font-medium transition-colors ${
            !activeCategory
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
            className={`rounded-full border px-3.5 py-1 text-[12px] font-medium transition-colors ${
              activeCategory === cat.slug
                ? "border-heading bg-heading text-white"
                : "border-border bg-white text-text hover:border-heading"
            }`}
          >
            {cat.name}
            <span className="ml-1 text-muted">({cat.productCount})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
