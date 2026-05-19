import crypto from "crypto";
import { Prisma } from "@ecommerce/database";
import type { OrderDTO, OrderItemDTO, Paginated, OrderStatus } from "@ecommerce/types";
import { ApiError } from "../lib/api-error";
import { prisma } from "../lib/prisma";
import { ordersRepository } from "../repositories/orders.repository";
import type { z } from "zod";
import type {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/orders";

type CreateInput = z.infer<typeof createOrderSchema>;
type ListQuery = z.infer<typeof orderListQuerySchema>;
type UpdateStatusInput = z.infer<typeof updateOrderStatusSchema>;

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function hashBody(body: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

function toOrderItemDTO(item: {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}): OrderItemDTO {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
  };
}

function toOrderDTO(order: {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  stripePaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
  }[];
}): OrderDTO {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    stripePaymentId: order.stripePaymentId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(toOrderItemDTO),
  };
}

export const ordersService = {
  async create(
    userId: string,
    dto: CreateInput,
    idempotencyKey?: string,
  ): Promise<OrderDTO> {
    const requestHash = hashBody(dto);

    // Optimistic idempotency check before doing any work
    if (idempotencyKey) {
      const existing = await ordersRepository.findIdempotencyKey(idempotencyKey);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ApiError(
            "UNPROCESSABLE_ENTITY",
            "Idempotency key already used with a different request body",
            422,
          );
        }
        const age = Date.now() - existing.createdAt.getTime();
        if (age < IDEMPOTENCY_TTL_MS) {
          const order = await ordersRepository.findById(existing.orderId);
          if (order) return toOrderDTO(order);
        }
      }
    }

    // Fetch and validate all products in a single query
    const productIds = dto.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ApiError("NOT_FOUND", "One or more products not found or inactive", 404, {
        productIds: missingIds,
      });
    }

    const priceMap = new Map(products.map((p) => [p.id, p.price]));
    const total = dto.items.reduce(
      (sum, item) => sum + priceMap.get(item.productId)! * item.quantity,
      0,
    );

    // Atomic transaction: conditional stock decrement + order creation + idempotency key
    let newOrder;
    try {
      newOrder = await prisma.$transaction(async (tx) => {
        for (const item of dto.items) {
          const affected = await tx.$executeRaw`
            UPDATE "Product"
            SET stock = stock - ${item.quantity}
            WHERE id = ${item.productId} AND stock >= ${item.quantity}
          `;
          if (affected === 0) {
            throw new ApiError(
              "CONFLICT",
              `Insufficient stock for product ${item.productId}`,
              409,
              { productId: item.productId },
            );
          }
        }

        const order = await tx.order.create({
          data: {
            userId,
            total,
            items: {
              create: dto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: priceMap.get(item.productId)!,
              })),
            },
          },
          include: { items: true },
        });

        if (idempotencyKey) {
          await tx.idempotencyKey.create({
            data: { key: idempotencyKey, orderId: order.id, requestHash },
          });
        }

        return order;
      });
    } catch (err) {
      // Race condition: a concurrent request with the same idempotency key committed first.
      // The transaction has been rolled back (stock restored). Return the winning request's order.
      if (
        idempotencyKey &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existing = await ordersRepository.findIdempotencyKey(idempotencyKey);
        if (existing && existing.requestHash === requestHash) {
          const order = await ordersRepository.findById(existing.orderId);
          if (order) return toOrderDTO(order);
        }
      }
      throw err;
    }

    return toOrderDTO(newOrder);
  },

  async listByUser(userId: string, query: ListQuery): Promise<Paginated<OrderDTO>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const { items, total } = await ordersRepository.findManyByUserId(userId, {
      skip,
      take: pageSize,
    });
    return { data: items.map(toOrderDTO), page, pageSize, total };
  },

  async getById(id: string, userId: string): Promise<OrderDTO> {
    const order = await ordersRepository.findById(id);
    if (!order) throw new ApiError("NOT_FOUND", "Order not found", 404);
    if (order.userId !== userId) throw new ApiError("FORBIDDEN", "Access denied", 403);
    return toOrderDTO(order);
  },

  async updateStatus(id: string, data: UpdateStatusInput): Promise<OrderDTO> {
    try {
      const order = await ordersRepository.updateStatus(id, data.status);
      const full = await ordersRepository.findById(order.id);
      return toOrderDTO(full!);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ApiError("NOT_FOUND", "Order not found", 404);
      }
      throw err;
    }
  },
};
