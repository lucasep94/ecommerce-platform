import type { User } from "@ecommerce/database";
import { prisma } from "../lib/prisma";

export const usersRepository = {
  findById: (id: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { id } }),

  findByClerkUserId: (clerkUserId: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { clerkUserId } }),

  upsertByClerk: (data: { clerkUserId: string; email: string; name: string }): Promise<User> =>
    prisma.user.upsert({
      where: { clerkUserId: data.clerkUserId },
      update: {},
      create: data,
    }),
};
