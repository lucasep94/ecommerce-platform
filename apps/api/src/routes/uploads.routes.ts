import { Router } from "express";
import { uploadsController } from "../controllers/uploads.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const uploadsRouter: Router = Router();

// Admin-only: mint a signed upload URL for a product image.
uploadsRouter.post(
  "/sign",
  requireAuth,
  requireRole("ADMIN"),
  uploadsController.signProductImage,
);
