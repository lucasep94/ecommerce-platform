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
    const imageCount = faker.number.int({ min: 1, max: 3 });

    await prisma.product.create({
      data: {
        slug,
        name,
        description: faker.commerce.productDescription(),
        price: Math.round(parseFloat(faker.commerce.price({ min: 5, max: 500 })) * 100),
        stock: faker.number.int({ min: 0, max: 50 }),
        images: Array.from({ length: imageCount }, () =>
          faker.image.url({ width: 640, height: 480 }),
        ),
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
