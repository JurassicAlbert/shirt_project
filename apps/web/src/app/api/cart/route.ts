import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { cartRepository } from "@/lib/repositories";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await checkRateLimit({
    scope: "api_cart",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 200,
    userLimit: 300,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const cart = await cartRepository.getActiveCartWithItems(session.userId);
  return apiOk(cart);
}
