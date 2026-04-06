import type { ReturnStatus } from "@prisma/client";
import { prisma } from "../db";

export class ReturnRepository {
  async create(input: {
    userId: string;
    orderId: string;
    orderItemId: string;
    reason: string;
  }) {
    return prisma.returnRequest.create({
      data: {
        userId: input.userId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        reason: input.reason,
        status: "requested",
      },
    });
  }

  async findById(id: string) {
    return prisma.returnRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        order: true,
        orderItem: true,
        user: { select: { id: true, email: true } },
      },
    });
  }

  async updateStatus(input: { id: string; status: ReturnStatus }) {
    const existing = await prisma.returnRequest.findFirst({
      where: { id: input.id, deletedAt: null },
    });
    if (!existing) return null;
    return prisma.returnRequest.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }

  async softDelete(id: string) {
    return prisma.returnRequest.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
