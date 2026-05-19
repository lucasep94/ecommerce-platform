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
  originalPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).min(0),
  brand: z.string().min(1).max(200),
  rating: z.number().min(0).max(5).nullable().optional(),
  reviewCount: z.number().int().min(0).optional(),
  categoryId: z.string().cuid(),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["top", "newest", "price-asc", "price-desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Accepts ids as a CSV string in the query (?ids=a,b,c) and normalizes to a cuid[].
// When present, the products controller short-circuits all other filters.
export const productsByIdsQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().cuid()).min(1).max(50)),
});
