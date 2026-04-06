import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { adminRepository } from "@/lib/repositories";

const bodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid payload", 400, parsed.error.flatten());
  }

  const result = await adminRepository.moderateDesign({
    designId: id,
    moderatorUserId: session.userId,
    decision: parsed.data.decision,
    reason: parsed.data.reason,
  });

  if (!result.ok) return apiError("NOT_FOUND", "Design not eligible for moderation", 404);

  return apiOk({ designId: id, decision: parsed.data.decision });
}
