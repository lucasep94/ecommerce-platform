import Link from "next/link";
import type { CategoryDTO } from "@ecommerce/types";

const CATEGORY_COLORS: Record<string, string> = {
  tshirts: "bg-[#fef3e2]",
  shoes: "bg-[#e8f4fd]",
  accessories: "bg-[#fce8f3]",
  electronics: "bg-[#e8fce8]",
  home: "bg-[#f3e8fc]",
  books: "bg-[#fce8e8]",
};

export function ShopByCategory({ categories }: { categories: CategoryDTO[] }) {
  const visible = categories
    .filter((c) => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {visible.map((cat) => (
        <Link
          key={cat.id}
          href={`/products?category=${cat.slug}`}
          className={`group flex flex-col items-center justify-center gap-2 rounded-2xl p-8 transition-shadow hover:shadow-md ${CATEGORY_COLORS[cat.slug] ?? "bg-bg-warm"}`}
        >
          <span className="font-heading text-[16px] font-semibold text-heading">{cat.name}</span>
          <span className="font-body text-[12px] text-muted">{cat.productCount} products</span>
        </Link>
      ))}
    </div>
  );
}
