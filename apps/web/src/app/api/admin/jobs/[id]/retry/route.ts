import { enqueueAiGenerationJob, enqueueMockupGenerationJob } from "@shirt/jobs";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { backgroundJobRepository, designRepository } from "@/lib/repositories";

type AiPayload = { designId: string; prompt: string; userId: string };
type MockupPayload = {
  userId: string;
  productId: string;
  variantId: string;
  designId: string;
  textOverlay?: string;
  cacheKey: string;
  productName: string;
  designImageUrl: string;
};

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await context.params;
  const job = await backgroundJobRepository.getById(id);
  if (!job) return apiError("NOT_FOUND", "Job not found", 404);
  if (job.status !== "dead_letter" && job.status !== "failed") {
    return apiError("BAD_REQUEST", "Only failed or dead-letter jobs can be retried", 400);
  }

  await backgroundJobRepository.resetForRetry(id);

  if (job.type === "ai_generation") {
    const p = job.payload as AiPayload;
    await designRepository.resetToPending({ designId: p.designId });
    await enqueueAiGenerationJob({
      jobRecordId: id,
      designId: p.designId,
      prompt: p.prompt,
    });
  } else if (job.type === "mockup_generation") {
    const p = job.payload as MockupPayload;
    await enqueueMockupGenerationJob({
      jobRecordId: id,
      userId: p.userId,
      productId: p.productId,
      variantId: p.variantId,
      designId: p.designId,
      textOverlay: p.textOverlay,
      cacheKey: p.cacheKey,
      productName: p.productName,
      designImageUrl: p.designImageUrl,
    });
  } else {
    return apiError("BAD_REQUEST", "Unknown job type", 400);
  }

  return apiOk({ requeued: true, jobId: id });
}
