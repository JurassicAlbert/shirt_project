import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { backgroundJobRepository } from "@/lib/repositories";

const querySchema = z.object({
  status: z.enum(["dead_letter", "waiting", "failed", "all"]).optional(),
});

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status") ?? "all";
  const parsed = querySchema.safeParse({ status: rawStatus });
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid status filter", 400, parsed.error.flatten());
  }

  const status = parsed.data.status ?? "all";
  const items =
    status === "all"
      ? await backgroundJobRepository.listRecent(150)
      : await backgroundJobRepository.listByStatus(status, 100);
  return apiOk({ items });
}
