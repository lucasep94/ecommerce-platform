import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";

export const authRouter: Router = Router();

authRouter.get("/me", requireAuth, authController.me);
