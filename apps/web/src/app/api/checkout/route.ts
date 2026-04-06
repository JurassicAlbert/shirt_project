import { checkoutRequestSchema } from "@shirt/contracts";
import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { createPaymentIntentForOrder } from "@/lib/create-payment-intent";
import { withIdempotency } from "@/lib/idempotency";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await checkRateLimit({
    scope: "api_checkout",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 30,
    userLimit: 45,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid checkout payload", 400, parsed.error.flatten());
  }

  try {
    const idem = await withIdempotency(
      {
        scope: `checkout:${session.userId}`,
        key: request.headers.get("idempotency-key"),
        requestPayload: parsed.data,
      },
      async () => {
        const { order, paymentRef, redirectUrl } = await createPaymentIntentForOrder({
          userId: session.userId,
          orderId: parsed.data.orderId,
        });
        return {
          statusCode: 200,
          body: {
            ok: true,
            data: {
              orderId: order.id,
              paymentStatus: order.paymentStatus,
              paymentRef,
              redirectUrl,
            },
          },
        };
      },
    );
    return idem.response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkout_failed";
    if (message === "order_not_found") return apiError("NOT_FOUND", "Order not found", 404);
    if (message === "order_not_payable") return apiError("BAD_REQUEST", "Order is not awaiting payment", 400);
    return apiError("INTERNAL_ERROR", "Checkout failed", 500);
  }
}
