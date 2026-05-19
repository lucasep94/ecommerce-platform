import type { NextFunction, Request, Response } from "express";
import type { User } from "@ecommerce/database";
import type { UserDTO } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";

function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const authController = {
  me(req: Request, res: Response<UserDTO>, next: NextFunction): void {
    if (!req.user) {
      return next(new ApiError("UNAUTHORIZED", "Authentication required", 401));
    }
    res.json(toUserDTO(req.user));
  },
};
