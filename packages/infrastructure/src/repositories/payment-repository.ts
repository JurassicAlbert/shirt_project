import { prisma } from "../db";

export class PaymentRepository {
  async recordInit(input: { orderId: string; provider: string; providerRef: string }) {
    return prisma.paymentAttempt.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        providerRef: input.providerRef,
        status: "initiated",
      },
    });
  }

  async markWebhookResult(input: {
    providerRef: string;
    success: boolean;
    failureReason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.paymentAttempt.findFirst({
        where: { providerRef: input.providerRef },
      });
      if (!attempt) return null;

      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: input.success ? "success" : "failed",
          failureReason: input.success ? null : (input.failureReason ?? "payment_failed"),
        },
      });

      const order = await tx.order.update({
        where: { id: attempt.orderId },
        data: {
          paymentStatus: input.success ? "success" : "failed",
        },
      });
      return { attemptId: attempt.id, orderId: order.id, orderStatus: order.status };
    });
  }
}
