import { enqueueMockupGenerationJob } from "@shirt/jobs";
import { z } from "zod";
import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { buildMockupCacheKey } from "@/lib/mockup-cache-key";
import {
  backgroundJobRepository,
  designRepository,
  mockupCacheRepository,
  productRepository,
} from "@/lib/repositories";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const previewSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  designId: z.string().uuid(),
  textOverlay: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await checkRateLimit({
    scope: "api_mockup_preview",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 60,
    userLimit: 80,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid preview payload", 400, parsed.error.flatten());
  }

  const product = await productRepository.getById(parsed.data.productId);
  if (!product) return apiError("NOT_FOUND", "Product not found", 404);

  const design = await designRepository.findOwned({
    designId: parsed.data.designId,
    userId: session.userId,
  });
  if (!design || !design.imageUrl || design.status !== "completed") {
    return apiError("BAD_REQUEST", "Design is not ready for preview", 400);
  }

  const cacheKey = buildMockupCacheKey({
    productId: parsed.data.productId,
    variantId: parsed.data.variantId,
    designId: parsed.data.designId,
    textOverlay: parsed.data.textOverlay,
  });

  const cached = await mockupCacheRepository.findByCacheKey(cacheKey);
  if (cached) {
    return apiOk({
      previewImageUrl: cached.publicUrl,
      status: "completed",
      cacheHit: true,
    });
  }

  const job = await backgroundJobRepository.create({
    type: "mockup_generation",
    payload: {
      userId: session.userId,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      designId: parsed.data.designId,
      textOverlay: parsed.data.textOverlay,
      cacheKey,
      productName: product.name,
      designImageUrl: design.imageUrl,
    },
  });

  try {
    await enqueueMockupGenerationJob({
      jobRecordId: job.id,
      userId: session.userId,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      designId: parsed.data.designId,
      textOverlay: parsed.data.textOverlay,
      cacheKey,
      productName: product.name,
      designImageUrl: design.imageUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "queue_unavailable";
    await backgroundJobRepository.markDeadLetter(job.id, message, 0);
    return apiError("INTERNAL_ERROR", "Job queue unavailable; ensure Redis is running and REDIS_URL is set", 503);
  }

  return apiOk(
    {
      jobId: job.id,
      status: "queued",
      pollJobUrl: `/api/jobs/${job.id}`,
      cacheHit: false,
    },
    202,
  );
}
