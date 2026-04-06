import { apiError, apiOk } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const user = await userRepository.findById(session.userId);
  if (!user) return apiError("UNAUTHORIZED", "Session user not found", 401);

  return apiOk({ userId: user.id, email: user.email, role: user.role });
}
