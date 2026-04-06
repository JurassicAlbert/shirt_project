import { editDesignRequestSchema } from "@shirt/contracts";
import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { designRepository } from "@/lib/repositories";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = editDesignRequestSchema.safeParse({ ...body, designId: id });
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid design edit payload", 400, parsed.error.flatten());
  }

  const updated = await designRepository.updateTextOverlayForOwner({
    designId: id,
    userId: session.userId,
    textOverlay: parsed.data.textOverlay,
  });

  if (!updated) {
    return apiError("NOT_FOUND", "Design not found", 404);
  }

  return apiOk({ id, updated: true, textOverlay: parsed.data.textOverlay ?? "" });
}
