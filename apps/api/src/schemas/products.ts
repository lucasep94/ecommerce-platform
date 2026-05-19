import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

export const createProductSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).min(0),
  categoryId: z.string().cuid(),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
