import { Router } from "express";
import { categoriesController } from "../controllers/categories.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const categoriesRouter: Router = Router();

// Public
categoriesRouter.get("/", categoriesController.list);
categoriesRouter.get("/:slug", categoriesController.getBySlug);

// Admin
categoriesRouter.post("/", requireAuth, requireRole("ADMIN"), categoriesController.create);
categoriesRouter.patch("/:id", requireAuth, requireRole("ADMIN"), categoriesController.update);
categoriesRouter.delete("/:id", requireAuth, requireRole("ADMIN"), categoriesController.remove);
