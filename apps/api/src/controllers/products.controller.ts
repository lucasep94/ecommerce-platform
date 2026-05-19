import type { Request, Response, NextFunction } from "express";
import { productsService } from "../services/products.service";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  productsByIdsQuerySchema,
} from "../schemas/products";

export const productsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // If ?ids=... is present, short-circuit all other filters and return a flat
      // ProductDTO[]. Used by the frontend cart/checkout for stock revalidation.
      if (typeof req.query.ids === "string" && req.query.ids.length > 0) {
        const { ids } = productsByIdsQuerySchema.parse(req.query);
        const products = await productsService.listPublicByIds(ids);
        res.json(products);
        return;
      }
      const query = productListQuerySchema.parse(req.query);
      const result = await productsService.listPublic(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req: Request<{ slug: string }>, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getPublicBySlug(req.params.slug);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const query = productListQuerySchema.parse(req.query);
      const result = await productsService.listAdmin(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productsService.create(data);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await productsService.update(req.params.id, data);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await productsService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
