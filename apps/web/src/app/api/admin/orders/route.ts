import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { adminRepository } from "@/lib/repositories";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const items = await adminRepository.listRecentOrders();
  return apiOk({ items });
}
