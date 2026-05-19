import { createClerkClient, verifyToken } from "@clerk/backend";
import { env } from "./env";

export const clerkClient: ReturnType<typeof createClerkClient> = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
});

export async function verifyClerkSessionToken(token: string): Promise<{ clerkUserId: string }> {
  const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
  if (!payload.sub) {
    throw new Error("Clerk token missing 'sub' claim");
  }
  return { clerkUserId: payload.sub };
}
