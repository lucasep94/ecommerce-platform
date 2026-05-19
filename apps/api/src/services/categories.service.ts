import { Prisma } from "@ecommerce/database";
import type { CategoryDTO } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";
import { categoriesRepository } from "../repositories/categories.repository";
import type { z } from "zod";
import type { createCategorySchema, updateCategorySchema } from "../schemas/categories";

type CreateInput = z.infer<typeof createCategorySchema>;
type UpdateInput = z.infer<typeof updateCategorySchema>;

function toCategoryDTO(c: { id: string; slug: string; name: string }): CategoryDTO {
  return { id: c.id, slug: c.slug, name: c.name };
}

function handlePrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new ApiError("CONFLICT", "Slug already exists", 409, { field: "slug" });
    }
    if (err.code === "P2025") {
      throw new ApiError("NOT_FOUND", "Category not found", 404);
    }
    if (err.code === "P2003") {
      throw new ApiError("CONFLICT", "Category has associated products", 409);
    }
  }
  throw err;
}

export const categoriesService = {
  async list(): Promise<CategoryDTO[]> {
    const categories = await categoriesRepository.findAll();
    return categories.map(toCategoryDTO);
  },

  async getBySlug(slug: string): Promise<CategoryDTO> {
    const category = await categoriesRepository.findBySlug(slug);
    if (!category) throw new ApiError("NOT_FOUND", "Category not found", 404);
    return toCategoryDTO(category);
  },

  async getById(id: string): Promise<CategoryDTO> {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new ApiError("NOT_FOUND", "Category not found", 404);
    return toCategoryDTO(category);
  },

  async create(data: CreateInput): Promise<CategoryDTO> {
    try {
      const category = await categoriesRepository.create(data);
      return toCategoryDTO(category);
    } catch (err) {
      handlePrismaError(err);
    }
  },

  async update(id: string, data: UpdateInput): Promise<CategoryDTO> {
    await categoriesService.getById(id);
    try {
      const category = await categoriesRepository.update(id, data);
      return toCategoryDTO(category);
    } catch (err) {
      handlePrismaError(err);
    }
  },

  async delete(id: string): Promise<void> {
    await categoriesService.getById(id);
    try {
      await categoriesRepository.delete(id);
    } catch (err) {
      handlePrismaError(err);
    }
  },
};
