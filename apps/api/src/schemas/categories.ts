import { z } from "zod";
import { slugSchema } from "./products";

export const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
});

export const updateCategorySchema = createCategorySchema.partial();
