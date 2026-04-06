import { orderRepository, paymentRepository } from "@/lib/repositories";
import { paymentProvider } from "@/lib/providers";
import { assertOrderTransition } from "@/lib/order-state-machine";

export async function createPaymentIntentForOrder(input: { userId: string; orderId: string }) {
  const order = await orderRepository.getOwnedOrder({
    orderId: input.orderId,
    userId: input.userId,
  });

  if (!order) {
    throw new Error("order_not_found");
  }

  if (order.status !== "created" && order.status !== "payment_pending") {
    throw new Error("order_not_payable");
  }

  const amount = Number(order.totalGross);
  const payment = await paymentProvider.initializePayment({ orderId: order.id, amount });

  await paymentRepository.recordInit({
    orderId: order.id,
    provider: "przelewy24",
    providerRef: payment.paymentRef,
  });

  if (order.status === "created") {
    assertOrderTransition("created", "payment_pending");
    await orderRepository.updateStatus({
      orderId: order.id,
      from: "created",
      to: "payment_pending",
      actor: "system",
      reason: "payment_intent_created",
      actorRole: "system",
    });
  }

  return {
    order,
    paymentRef: payment.paymentRef,
    redirectUrl: payment.redirectUrl,
  };
}
