import { Prisma } from "@ecommerce/database";
import { prisma } from "../lib/prisma";
import type { OrderStatus } from "@ecommerce/types";

interface FindManyAdminParams {
  skip: number;
  take: number;
  status?: OrderStatus;
  search?: string;
}

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

  async findManyAdmin({ skip, take, status, search }: FindManyAdminParams) {
    // Admin orders list: optional status filter + optional search that
    // matches either the order id prefix (cuids are opaque so we use
    // startsWith) OR a substring of the buyer's email/name.
    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { id: { startsWith: search } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, email: true, name: true } },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  },

  async findByIdAdmin(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  },

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  },

  async findIdempotencyKey(key: string) {
    return prisma.idempotencyKey.findUnique({ where: { key } });
  },
};
