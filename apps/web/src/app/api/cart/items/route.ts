import { cartItemSchema } from "@shirt/contracts";
import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { cartRepository, productRepository } from "@/lib/repositories";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const cartMutationLimit = async (request: Request, userId: string) => {
  const rl = await checkRateLimit({
    scope: "api_cart_items",
    ip: getClientIp(request),
    userId,
    ipLimit: 120,
    userLimit: 180,
  });
  return rl;
};

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await cartMutationLimit(request, session.userId);
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = cartItemSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid cart item payload", 400, parsed.error.flatten());
  }

  const variant = await productRepository.findVariant(parsed.data.variantId);
  if (!variant) return apiError("NOT_FOUND", "Variant not found", 404);

  const item = await cartRepository.addItem({
    userId: session.userId,
    productId: parsed.data.productId,
    variantId: parsed.data.variantId,
    designId: parsed.data.designId,
    textOverlay: parsed.data.textOverlay,
    quantity: parsed.data.quantity,
  });
  return apiOk(item, 201);
}

export async function PATCH(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await cartMutationLimit(request, session.userId);
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.itemId !== "string" || typeof body.quantity !== "number") {
    return apiError("VALIDATION_ERROR", "Invalid update payload", 400);
  }
  await cartRepository.updateItemQuantity({
    userId: session.userId,
    itemId: body.itemId,
    quantity: body.quantity,
  });
  return apiOk({ updated: true });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await cartMutationLimit(request, session.userId);
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.itemId !== "string") {
    return apiError("VALIDATION_ERROR", "Invalid delete payload", 400);
  }
  await cartRepository.removeItem({ userId: session.userId, itemId: body.itemId });
  return apiOk({ deleted: true });
}
