import type { ProductDTO } from "@ecommerce/types";
import { ProductCard } from "./ProductCard";

interface Props {
  products: ProductDTO[];
  cols?: 4 | 5;
}

const colClass = {
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-5",
};

export function ProductGrid({ products, cols = 4 }: Props) {
  return (
    <div className={`grid gap-5 ${colClass[cols]}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
