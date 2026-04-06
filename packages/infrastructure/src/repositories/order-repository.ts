import type { OrderStatus } from "@prisma/client";
import { prisma } from "../db";

const round2 = (value: number) => Math.round(value * 100) / 100;

const splitGrossByVat = (gross: number, vatRatePercent: number) => {
  const divisor = 1 + vatRatePercent / 100;
  const net = gross / divisor;
  const vat = gross - net;
  return { net: round2(net), vat: round2(vat) };
};

type CartItemWithConfig = {
  id: string;
  quantity: number;
  configuration: {
    id: string;
    productId: string;
    variantId: string;
    product: { vatRate: unknown };
    variant: {
      grossPrice: unknown;
      stock: number;
    };
  };
};

export class OrderRepository {
  async createFromCart(input: { userId: string; cartId: string }) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { id: input.cartId, userId: input.userId, isActive: true },
        include: {
          items: {
            include: {
              configuration: {
                include: { product: true, variant: true },
              },
            },
          },
        },
      });
      if (!cart || cart.items.length === 0) {
        throw new Error("empty_cart");
      }
      const cartItems = cart.items as unknown as CartItemWithConfig[];

      const totals = cartItems.reduce(
        (acc, item) => {
          const gross = Number(item.configuration.variant.grossPrice);
          const vatRate = Number(item.configuration.product.vatRate);
          const lineGross = gross * item.quantity;
          const { net: lineNet, vat: lineVat } = splitGrossByVat(gross, vatRate);
          acc.totalGross += lineGross;
          acc.totalVat += lineVat * item.quantity;
          acc.totalNet += lineNet * item.quantity;
          return acc;
        },
        { totalGross: 0, totalVat: 0, totalNet: 0 },
      );

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          totalGross: round2(totals.totalGross),
          totalVat: round2(totals.totalVat),
          totalNet: round2(totals.totalNet),
          status: "created",
          paymentStatus: "initiated",
        },
      });

      for (const item of cartItems) {
        const unitGross = Number(item.configuration.variant.grossPrice);
        const vatRate = Number(item.configuration.product.vatRate);
        const { vat: unitVat } = splitGrossByVat(unitGross, vatRate);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.configuration.productId,
            variantId: item.configuration.variantId,
            configurationId: item.configuration.id,
            quantity: item.quantity,
            unitGross,
            unitVat,
          },
        });

        const latestVariant = await tx.variant.findUnique({
          where: { id: item.configuration.variantId },
          select: { stock: true, version: true },
        });
        if (!latestVariant || latestVariant.stock < item.quantity) {
          throw new Error("insufficient_stock");
        }

        const updated = await tx.variant.updateMany({
          where: {
            id: item.configuration.variantId,
            version: latestVariant.version,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          throw new Error("insufficient_stock");
        }
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { isActive: false },
      });

      const popularityByProduct = new Map<string, number>();
      for (const item of cartItems) {
        const pid = item.configuration.productId;
        popularityByProduct.set(pid, (popularityByProduct.get(pid) ?? 0) + item.quantity);
      }
      for (const [productId, qty] of popularityByProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { popularityScore: { increment: qty } },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    });
  }

  async updateStatus(input: {
    orderId: string;
    from: OrderStatus;
    to: OrderStatus;
    actor?: string;
    reason?: string;
    actorId?: string | null;
    actorRole?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: input.orderId, status: input.from, deletedAt: null },
        data: { status: input.to },
      });
      if (updated.count !== 1) return null;

      await tx.orderTransitionLog.create({
        data: {
          orderId: input.orderId,
          fromStatus: input.from,
          toStatus: input.to,
          actor: input.actor,
          reason: input.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          ...(input.actorId != null ? { actorId: input.actorId } : {}),
          ...(input.actorRole != null ? { actorRole: input.actorRole } : {}),
          eventType: "order_status_change",
          entityType: "Order",
          entityId: input.orderId,
          payload: {
            from: input.from,
            to: input.to,
            reason: input.reason ?? null,
            actorLabel: input.actor ?? null,
          },
        },
      });

      return tx.order.findUnique({ where: { id: input.orderId } });
    });
  }

  async findById(orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: { items: true },
    });
  }

  async listByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId, deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOwnedOrder(input: { orderId: string; userId: string }) {
    return prisma.order.findFirst({
      where: { id: input.orderId, userId: input.userId, deletedAt: null },
      include: { items: true },
    });
  }

  async softDelete(orderId: string) {
    return prisma.order.updateMany({
      where: { id: orderId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async listTransitionLogs(orderId: string) {
    return prisma.orderTransitionLog.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }
}
