import { prisma } from "../lib/prisma";
import type { CreateProductDTO, UpdateProductDTO } from "@ecommerce/types";

type SortOption = "top" | "newest" | "price-asc" | "price-desc";

interface FindManyPublicParams {
  categorySlug?: string;
  search?: string;
  sort?: SortOption;
  skip: number;
  take: number;
}

interface FindManyAdminParams {
  skip: number;
  take: number;
}

function resolveOrderBy(sort?: SortOption) {
  switch (sort) {
    case "top":
      return [{ rating: "desc" as const }, { reviewCount: "desc" as const }];
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

export const productsRepository = {
  async findManyPublic({ categorySlug, search, sort, skip, take }: FindManyPublicParams) {
    const where = {
      isActive: true,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, skip, take, orderBy: resolveOrderBy(sort) }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },

  async findBySlugPublic(slug: string) {
    return prisma.product.findFirst({ where: { slug, isActive: true } });
  },

  async findByIdAdmin(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async findManyAdmin({ skip, take }: FindManyAdminParams) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
      prisma.product.count(),
    ]);
    return { items, total };
  },

  async create(data: CreateProductDTO) {
    return prisma.product.create({ data });
  },

  async update(id: string, data: UpdateProductDTO) {
    return prisma.product.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },
};
