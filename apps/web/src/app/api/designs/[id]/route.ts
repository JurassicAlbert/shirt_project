import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { designRepository } from "@/lib/repositories";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await context.params;
  const design = await designRepository.findOwned({ designId: id, userId: session.userId });
  if (!design) return apiError("NOT_FOUND", "Design not found", 404);
  return apiOk({ id: design.id, status: design.status, imageUrl: design.imageUrl, errorMessage: design.errorMessage });
}
