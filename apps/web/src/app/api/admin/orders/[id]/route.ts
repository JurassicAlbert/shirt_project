import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { buildOrderTimeline } from "@/lib/order-timeline";
import { getAllowedOrderTransitions } from "@/lib/order-state-machine";
import { orderRepository } from "@/lib/repositories";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await context.params;
  const order = await orderRepository.findById(id);
  if (!order) return apiError("NOT_FOUND", "Order not found", 404);

  const logs = await orderRepository.listTransitionLogs(id);
  const timeline = buildOrderTimeline(
    order.status,
    logs.map((l) => ({ fromStatus: l.fromStatus, toStatus: l.toStatus })),
  );

  return apiOk({
    order: {
      id: order.id,
      status: order.status,
      totalGross: order.totalGross,
      createdAt: order.createdAt,
      userId: order.userId,
      items: order.items,
    },
    transitions: logs,
    timeline,
    nextStatuses: getAllowedOrderTransitions(order.status),
  });
}
