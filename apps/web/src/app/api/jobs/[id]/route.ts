import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { backgroundJobRepository } from "@/lib/repositories";

type JobPayload = { userId?: string };

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await context.params;
  const job = await backgroundJobRepository.getById(id);
  if (!job) return apiError("NOT_FOUND", "Job not found", 404);

  const payload = job.payload as JobPayload;
  const ownerId = payload.userId;
  if (ownerId && ownerId !== session.userId && session.role !== "admin") {
    return apiError("FORBIDDEN", "Not allowed to view this job", 403);
  }

  return apiOk({
    id: job.id,
    type: job.type,
    status: job.status,
    result: job.result,
    errorReason: job.errorReason,
    attemptCount: job.attemptCount,
    updatedAt: job.updatedAt,
  });
}
