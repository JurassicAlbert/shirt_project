import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { withIdempotency } from "@/lib/idempotency";
import { assertOrderTransition } from "@/lib/order-state-machine";
import { orderRepository, paymentRepository } from "@/lib/repositories";

const webhookSchema = z.object({
  providerRef: z.string().min(3),
  status: z.enum(["success", "failed"]),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid webhook payload", 400, parsed.error.flatten());
  }

  const idem = await withIdempotency(
    {
      scope: "payment_webhook",
      key: request.headers.get("idempotency-key"),
      requestPayload: parsed.data,
    },
    async () => {
      const updated = await paymentRepository.markWebhookResult({
        providerRef: parsed.data.providerRef,
        success: parsed.data.status === "success",
        failureReason: parsed.data.reason,
      });
      if (!updated) {
        return {
          statusCode: 404,
          body: { ok: false, error: { code: "NOT_FOUND", message: "Payment attempt not found" } },
        };
      }

      const order = await orderRepository.findById(updated.orderId);
      if (!order) {
        return {
          statusCode: 404,
          body: { ok: false, error: { code: "NOT_FOUND", message: "Order not found" } },
        };
      }
      const to = parsed.data.status === "success" ? "paid" : "failed";
      assertOrderTransition(order.status, to);
      await orderRepository.updateStatus({
        orderId: order.id,
        from: order.status,
        to,
        actor: "payment_webhook",
        reason: parsed.data.reason,
        actorRole: "payment_webhook",
      });

      return { statusCode: 200, body: { ok: true, data: { acknowledged: true, orderId: order.id, status: to } } };
    },
  );

  return idem.response;
}
