import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";

export function requireRole(role: Role): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError("UNAUTHORIZED", "Authentication required", 401));
    }
    if (req.user.role !== role) {
      return next(new ApiError("FORBIDDEN", `Requires ${role} role`, 403));
    }
    next();
  };
}
