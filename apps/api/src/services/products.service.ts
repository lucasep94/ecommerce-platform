import { Prisma } from "@ecommerce/database";
import type { ProductDTO, Paginated } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";
import { productsRepository } from "../repositories/products.repository";
import { categoriesRepository } from "../repositories/categories.repository";
import type { z } from "zod";
import type {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "../schemas/products";

type ListQuery = z.infer<typeof productListQuerySchema>;
type CreateInput = z.infer<typeof createProductSchema>;
type UpdateInput = z.infer<typeof updateProductSchema>;

function toProductDTO(p: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    images: p.images,
    categoryId: p.categoryId,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function handlePrismaError(err: unknown, context: "product" | "category"): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new ApiError("CONFLICT", "Slug already exists", 409, { field: "slug" });
    }
    if (err.code === "P2025") {
      throw new ApiError("NOT_FOUND", `${context} not found`, 404);
    }
  }
  throw err;
}

export const productsService = {
  async listPublic(query: ListQuery): Promise<Paginated<ProductDTO>> {
    const { category, search, page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const { items, total } = await productsRepository.findManyPublic({
      categorySlug: category,
      search,
      skip,
      take: pageSize,
    });
    return { data: items.map(toProductDTO), page, pageSize, total };
  },

  async getPublicBySlug(slug: string): Promise<ProductDTO> {
    const product = await productsRepository.findBySlugPublic(slug);
    if (!product) throw new ApiError("NOT_FOUND", "Product not found", 404);
    return toProductDTO(product);
  },

  async listAdmin(query: { page: number; pageSize: number }): Promise<Paginated<ProductDTO>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const { items, total } = await productsRepository.findManyAdmin({ skip, take: pageSize });
    return { data: items.map(toProductDTO), page, pageSize, total };
  },

  async getAdminById(id: string): Promise<ProductDTO> {
    const product = await productsRepository.findByIdAdmin(id);
    if (!product) throw new ApiError("NOT_FOUND", "Product not found", 404);
    return toProductDTO(product);
  },

  async create(data: CreateInput): Promise<ProductDTO> {
    const category = await categoriesRepository.findById(data.categoryId);
    if (!category) throw new ApiError("NOT_FOUND", "Category not found", 404);
    try {
      const product = await productsRepository.create(data);
      return toProductDTO(product);
    } catch (err) {
      handlePrismaError(err, "product");
    }
  },

  async update(id: string, data: UpdateInput): Promise<ProductDTO> {
    if (data.categoryId) {
      const category = await categoriesRepository.findById(data.categoryId);
      if (!category) throw new ApiError("NOT_FOUND", "Category not found", 404);
    }
    try {
      const product = await productsRepository.update(id, data);
      return toProductDTO(product);
    } catch (err) {
      handlePrismaError(err, "product");
    }
  },

  async softDelete(id: string): Promise<void> {
    const existing = await productsRepository.findByIdAdmin(id);
    if (!existing) throw new ApiError("NOT_FOUND", "Product not found", 404);
    if (!existing.isActive) return;
    await productsRepository.softDelete(id);
  },
};
