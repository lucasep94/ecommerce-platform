import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "tshirts", name: "T-Shirts" },
  { slug: "shoes", name: "Shoes" },
  { slug: "accessories", name: "Accessories" },
  { slug: "electronics", name: "Electronics" },
  { slug: "home", name: "Home" },
  { slug: "books", name: "Books" },
];

function toSlug(text: string, suffix: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") +
    "-" +
    suffix
  );
}

async function main() {
  // Clean in FK-safe order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Seed categories
  const categories = await Promise.all(
    CATEGORIES.map((c) => prisma.category.create({ data: c })),
  );

  // Seed ~80 products
  for (let i = 0; i < 80; i++) {
    const name = faker.commerce.productName();
    const suffix = faker.string.alphanumeric(6).toLowerCase();
    const slug = toSlug(name, suffix);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const imageCount = faker.number.int({ min: 1, max: 4 });
    const price = Math.round(parseFloat(faker.commerce.price({ min: 5, max: 500 })) * 100);
    const hasDiscount = Math.random() < 0.3;
    const originalPrice = hasDiscount
      ? Math.round(price * faker.number.float({ min: 1.1, max: 1.4, fractionDigits: 2 }))
      : null;

    await prisma.product.create({
      data: {
        slug,
        name,
        description: faker.commerce.productDescription(),
        price,
        originalPrice,
        stock: faker.number.int({ min: 0, max: 50 }),
        images: Array.from({ length: imageCount }, (_, idx) =>
          `https://picsum.photos/seed/${slug}-${idx}/640/480`,
        ),
        brand: faker.company.name(),
        rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        reviewCount: faker.number.int({ min: 12, max: 850 }),
        categoryId: category.id,
        isActive: true,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${categories.length} categories and 80 products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
