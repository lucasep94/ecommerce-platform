import type { Request, Response, NextFunction } from "express";
import { ordersService } from "../services/orders.service";
import {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/orders";

export const ordersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      const idempotencyKey = req.headers["idempotency-key"];
      const key = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey;
      const order = await ordersService.create(req.user!.id, data, key);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = orderListQuerySchema.parse(req.query);
      const result = await ordersService.listByUser(req.user!.id, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getById(req.params.id, req.user!.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const data = updateOrderStatusSchema.parse(req.body);
      const order = await ordersService.updateStatus(req.params.id, data);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
};
