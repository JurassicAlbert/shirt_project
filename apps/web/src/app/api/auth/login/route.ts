import bcrypt from "bcryptjs";
import { loginRequestSchema } from "@shirt/contracts";
import { apiError, apiOk } from "@/lib/api-response";
import { setSessionCookie } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid login payload", 400, parsed.error.flatten());
  }

  const user = await userRepository.findByEmail(parsed.data.email);
  if (!user) return apiError("UNAUTHORIZED", "Invalid credentials", 401);

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) return apiError("UNAUTHORIZED", "Invalid credentials", 401);

  await setSessionCookie({ userId: user.id, role: user.role });
  return apiOk({ userId: user.id, email: user.email, role: user.role });
}
