import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { auditWriteRepository, returnRepository } from "@/lib/repositories";

const decisionSchema = z.object({
  status: z.enum(["approved", "rejected", "refunded", "escalated"]),
  note: z.string().max(500).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await context.params;
  const existing = await returnRepository.findById(id);
  if (!existing) return apiError("NOT_FOUND", "Return request not found", 404);

  const history = await auditWriteRepository.listForEntity("ReturnRequest", id, 40);

  return apiOk({
    return: existing,
    history: history.map((h) => ({
      id: h.id,
      eventType: h.eventType,
      createdAt: h.createdAt,
      actorId: h.actorId,
      actorRole: h.actorRole,
      payload: h.payload,
    })),
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (session.role !== "admin") return apiError("FORBIDDEN", "Admin only", 403);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid return decision", 400, parsed.error.flatten());
  }

  const existing = await returnRepository.findById(id);
  if (!existing) return apiError("NOT_FOUND", "Return request not found", 404);

  const prev = existing.status;
  const updated = await returnRepository.updateStatus({ id, status: parsed.data.status });
  if (!updated) return apiError("NOT_FOUND", "Return request not found", 404);

  await auditWriteRepository.log({
    actorId: session.userId,
    actorRole: session.role,
    eventType: "return_decision",
    entityType: "ReturnRequest",
    entityId: id,
    payload: {
      previousStatus: prev,
      newStatus: parsed.data.status,
      note: parsed.data.note ?? null,
      orderId: existing.orderId,
    },
  });

  return apiOk({ id: updated.id, status: updated.status });
}
