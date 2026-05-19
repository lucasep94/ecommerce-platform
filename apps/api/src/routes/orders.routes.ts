import { Router } from "express";
import { ordersController } from "../controllers/orders.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const ordersRouter: Router = Router();

ordersRouter.post("/", requireAuth, ordersController.create);
ordersRouter.get("/", requireAuth, ordersController.list);
ordersRouter.get("/:id", requireAuth, ordersController.getById);
ordersRouter.patch("/:id/status", requireAuth, requireRole("ADMIN"), ordersController.updateStatus);
