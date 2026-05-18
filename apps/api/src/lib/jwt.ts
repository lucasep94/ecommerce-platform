import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "@ecommerce/types";

const accessSecret = process.env.JWT_ACCESS_SECRET ?? "";
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "";
const accessExpires = (process.env.JWT_ACCESS_EXPIRES ?? "15m") as SignOptions["expiresIn"];
const refreshExpires = (process.env.JWT_REFRESH_EXPIRES ?? "7d") as SignOptions["expiresIn"];

export function signAccessToken(payload: JwtPayload): string {
  if (!accessSecret) throw new Error("JWT_ACCESS_SECRET is not set");
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires });
}

export function signRefreshToken(payload: JwtPayload): string {
  if (!refreshSecret) throw new Error("JWT_REFRESH_SECRET is not set");
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires });
}

export function verifyToken(
  token: string,
  kind: "access" | "refresh" = "access",
): JwtPayload {
  const secret = kind === "access" ? accessSecret : refreshSecret;
  if (!secret) throw new Error(`JWT ${kind} secret is not set`);
  return jwt.verify(token, secret) as JwtPayload;
}
