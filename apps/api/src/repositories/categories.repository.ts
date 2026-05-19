import { prisma } from "../lib/prisma";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "@ecommerce/types";

export const categoriesRepository = {
  async findAll() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
  },

  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },

  async create(data: CreateCategoryDTO) {
    return prisma.category.create({ data });
  },

  async update(id: string, data: UpdateCategoryDTO) {
    return prisma.category.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
