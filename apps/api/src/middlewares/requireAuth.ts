import type { NextFunction, Request, Response } from "express";
import type { User } from "@ecommerce/database";
import { verifyClerkSessionToken } from "../lib/clerk";
import { usersService } from "../services/users.service";
import { ApiError } from "../lib/api-error";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError("UNAUTHORIZED", "Missing or invalid Authorization header", 401));
  }
  const token = header.slice("Bearer ".length).trim();

  let clerkUserId: string;
  try {
    ({ clerkUserId } = await verifyClerkSessionToken(token));
  } catch {
    return next(new ApiError("UNAUTHORIZED", "Invalid or expired session token", 401));
  }

  try {
    req.user = await usersService.ensureLocalUser(clerkUserId);
    next();
  } catch (err) {
    next(err);
  }
}
