import { prisma } from "../lib/prisma";
import type { CreateProductDTO, UpdateProductDTO } from "@ecommerce/types";

interface FindManyPublicParams {
  categorySlug?: string;
  search?: string;
  skip: number;
  take: number;
}

interface FindManyAdminParams {
  skip: number;
  take: number;
}

export const productsRepository = {
  async findManyPublic({ categorySlug, search, skip, take }: FindManyPublicParams) {
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
      prisma.product.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
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
