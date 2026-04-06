import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { cartRepository, orderRepository } from "@/lib/repositories";
import { withIdempotency } from "@/lib/idempotency";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rlPost = await checkRateLimit({
    scope: "api_orders_post",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 40,
    userLimit: 60,
  });
  if (!rlPost.ok) return apiRateLimited(rlPost.message, rlPost.retryAfterSec);

  const cart = await cartRepository.getActiveCartWithItems(session.userId);
  if (!cart || cart.items.length === 0) {
    return apiError("BAD_REQUEST", "Cart is empty", 400);
  }

  try {
    const idem = await withIdempotency(
      {
        scope: `order_create:${session.userId}`,
        key: request.headers.get("idempotency-key") ?? requestIdFromCart(cart.id),
        requestPayload: { cartId: cart.id },
      },
      async () => {
        const order = await orderRepository.createFromCart({
          userId: session.userId,
          cartId: cart.id,
        });
        return { statusCode: 201, body: { ok: true, data: order } };
      },
    );
    return idem.response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "order_failed";
    if (message === "insufficient_stock") {
      return apiError("BAD_REQUEST", "Insufficient stock for one or more items", 409);
    }
    if (message === "empty_cart") {
      return apiError("BAD_REQUEST", "Cart is empty", 400);
    }
    return apiError("INTERNAL_ERROR", "Could not create order", 500);
  }
}

const requestIdFromCart = (cartId: string) => `cart-${cartId}`;

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rlGet = await checkRateLimit({
    scope: "api_orders_get",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 120,
    userLimit: 200,
  });
  if (!rlGet.ok) return apiRateLimited(rlGet.message, rlGet.retryAfterSec);

  const orders = await orderRepository.listByUser(session.userId);
  return apiOk({ items: orders });
}
