import { createHash } from "node:crypto";
import { enqueueAiGenerationJob } from "@shirt/jobs";
import { generateDesignRequestSchema } from "@shirt/contracts";
import { assertAiAllowance } from "@/lib/ai-guard";
import { apiError, apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { backgroundJobRepository, designRepository } from "@/lib/repositories";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const rl = await checkRateLimit({
    scope: "api_ai_generate",
    ip: getClientIp(request),
    userId: session.userId,
    ipLimit: 40,
    userLimit: 60,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = generateDesignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid generate payload", 400, parsed.error.flatten());
  }

  const allowance = await assertAiAllowance(session.userId);
  if (!allowance.ok) {
    return apiError("FORBIDDEN", allowance.reason, 429);
  }

  const normalizedPrompt = parsed.data.prompt.trim().toLowerCase();
  const promptHash = createHash("sha256").update(normalizedPrompt).digest("hex");
  const design = await designRepository.create({
    userId: session.userId,
    prompt: parsed.data.prompt,
    normalizedPrompt,
    promptHash,
    status: "pending",
  });

  const job = await backgroundJobRepository.create({
    type: "ai_generation",
    payload: {
      designId: design.id,
      prompt: parsed.data.prompt,
      userId: session.userId,
    },
  });

  try {
    await enqueueAiGenerationJob({
      jobRecordId: job.id,
      designId: design.id,
      prompt: parsed.data.prompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "queue_unavailable";
    await backgroundJobRepository.markDeadLetter(job.id, message, 0);
    await designRepository.failGeneration({ designId: design.id, errorMessage: message });
    return apiError("INTERNAL_ERROR", "Job queue unavailable; ensure Redis is running and REDIS_URL is set", 503);
  }

  return apiOk(
    { id: design.id, jobId: job.id, status: "pending", pollJobUrl: `/api/jobs/${job.id}`, cached: false },
    202,
  );
}
