import { prisma } from "../lib/prisma";
import type { OrderStatus } from "@ecommerce/types";

export const ordersRepository = {
  async findManyByUserId(userId: string, { skip, take }: { skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  },

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  },

  async findIdempotencyKey(key: string) {
    return prisma.idempotencyKey.findUnique({ where: { key } });
  },
};
