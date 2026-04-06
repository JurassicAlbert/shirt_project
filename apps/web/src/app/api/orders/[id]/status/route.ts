import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { assertOrderTransition } from "@/lib/order-state-machine";
import { orderRepository } from "@/lib/repositories";

const schema = z.object({
  to: z.enum(["payment_pending", "paid", "failed", "shipped", "completed"]),
  reason: z.string().max(300).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin role required", 403);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid status payload", 400, parsed.error.flatten());
  }

  const order = await orderRepository.findById(id);
  if (!order) return apiError("NOT_FOUND", "Order not found", 404);

  try {
    assertOrderTransition(order.status, parsed.data.to);
    const updated = await orderRepository.updateStatus({
      orderId: id,
      from: order.status,
      to: parsed.data.to,
      actor: `admin:${session.userId}`,
      reason: parsed.data.reason,
      actorId: session.userId,
      actorRole: session.role,
    });
    if (!updated) return apiError("CONFLICT", "Order state changed; retry", 409);
    return apiOk({ id: updated.id, status: updated.status });
  } catch {
    return apiError("BAD_REQUEST", "Invalid order transition", 400);
  }
}
