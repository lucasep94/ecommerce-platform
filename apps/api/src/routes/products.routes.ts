import { Router } from "express";
import { productsController } from "../controllers/products.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const productsRouter: Router = Router();

// Public
productsRouter.get("/", productsController.list);
productsRouter.get("/admin/all", requireAuth, requireRole("ADMIN"), productsController.listAdmin);
productsRouter.get("/:slug", productsController.getBySlug);

// Admin
productsRouter.post("/", requireAuth, requireRole("ADMIN"), productsController.create);
productsRouter.patch("/:id", requireAuth, requireRole("ADMIN"), productsController.update);
productsRouter.delete("/:id", requireAuth, requireRole("ADMIN"), productsController.remove);
