import { z } from "zod";
import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { createPaymentIntentForOrder } from "@/lib/create-payment-intent";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const paymentInitSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await checkRateLimit({
    scope: "api_payment_init",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 30,
    userLimit: 45,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = paymentInitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid payment init payload", 400, parsed.error.flatten());
  }

  try {
    const { order, paymentRef, redirectUrl } = await createPaymentIntentForOrder({
      userId: session.userId,
      orderId: parsed.data.orderId,
    });

    console.info("[payment.init]", { orderId: order.id, amount: Number(order.totalGross), provider: "przelewy24" });
    return apiOk({ paymentRef, redirectUrl, orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "payment_init_failed";
    if (message === "order_not_found") return apiError("NOT_FOUND", "Order not found", 404);
    if (message === "order_not_payable") return apiError("BAD_REQUEST", "Order is not awaiting payment", 400);
    return apiError("INTERNAL_ERROR", "Payment initialization failed", 500);
  }
}
