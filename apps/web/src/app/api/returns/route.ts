import { returnRequestSchema } from "@shirt/contracts";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { orderRepository, returnRepository } from "@/lib/repositories";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const body = await request.json().catch(() => null);
  const parsed = returnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid return payload", 400, parsed.error.flatten());
  }

  const order = await orderRepository.getOwnedOrder({
    orderId: parsed.data.orderId,
    userId: session.userId,
  });

  if (!order) {
    return apiError("NOT_FOUND", "Order not found", 404);
  }

  const item = order.items.find((i) => i.id === parsed.data.orderItemId);
  if (!item) {
    return apiError("NOT_FOUND", "Order line item not found", 404);
  }

  const reasonText = parsed.data.details
    ? `${parsed.data.reason}: ${parsed.data.details}`
    : parsed.data.reason;

  const created = await returnRepository.create({
    userId: session.userId,
    orderId: parsed.data.orderId,
    orderItemId: parsed.data.orderItemId,
    reason: reasonText,
  });

  return apiOk(created, 201);
}
