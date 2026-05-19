import type { User } from "@ecommerce/database";
import { usersRepository } from "../repositories/users.repository";
import { clerkClient } from "../lib/clerk";
import { ApiError } from "../lib/api-error";

export const usersService = {
  async ensureLocalUser(clerkUserId: string): Promise<User> {
    const existing = await usersRepository.findByClerkUserId(clerkUserId);
    if (existing) return existing;

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
    const email = primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new ApiError("UNAUTHORIZED", "Clerk user has no email address", 401);
    }
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email;

    return usersRepository.upsertByClerk({ clerkUserId, email, name });
  },
};
