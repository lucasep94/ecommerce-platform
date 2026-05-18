import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "@ecommerce/types";
import { env } from "./env";

const accessExpires = env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"];
const refreshExpires = env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"];

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: accessExpires });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshExpires });
}

export function verifyToken(
  token: string,
  kind: "access" | "refresh" = "access",
): JwtPayload {
  const secret = kind === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret) as JwtPayload;
}
