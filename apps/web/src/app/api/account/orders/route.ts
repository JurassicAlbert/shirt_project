import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { orderRepository } from "@/lib/repositories";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const orders = await orderRepository.listByUser(session.userId);
  return apiOk({ items: orders });
}
