import type { Request, Response, NextFunction } from "express";
import { categoriesService } from "../services/categories.service";
import { createCategorySchema, updateCategorySchema } from "../schemas/categories";

export const categoriesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.list();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req: Request<{ slug: string }>, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getBySlug(req.params.slug);
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoriesService.create(data);
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await categoriesService.update(req.params.id, data);
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await categoriesService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
