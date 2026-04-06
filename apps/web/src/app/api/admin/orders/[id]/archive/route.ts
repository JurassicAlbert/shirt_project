import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { auditWriteRepository, orderRepository } from "@/lib/repositories";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await context.params;
  const order = await orderRepository.findById(id);
  if (!order) return apiError("NOT_FOUND", "Order not found", 404);

  const updated = await orderRepository.softDelete(id);
  if (updated.count === 0) return apiError("NOT_FOUND", "Order not found", 404);

  await auditWriteRepository.log({
    actorId: session.userId,
    actorRole: session.role,
    eventType: "order_soft_delete",
    entityType: "Order",
    entityId: id,
    payload: { previousStatus: order.status },
  });

  return apiOk({ archived: true, id });
}
