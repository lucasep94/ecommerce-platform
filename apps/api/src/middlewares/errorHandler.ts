import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";
import { env } from "../lib/env";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError("NOT_FOUND", "Route not found", 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.issues.map((i) => ({ path: i.path, message: i.message })),
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.status).json(body);
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "Internal server error"
          : err instanceof Error
            ? err.message
            : String(err),
    },
  };
  res.status(500).json(body);
}
