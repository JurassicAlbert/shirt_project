import bcrypt from "bcryptjs";
import { registerRequestSchema } from "@shirt/contracts";
import { apiError, apiOk } from "@/lib/api-response";
import { setSessionCookie } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid register payload", 400, parsed.error.flatten());
  }

  const existing = await userRepository.findByEmail(parsed.data.email);
  if (existing) {
    return apiError("CONFLICT", "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await userRepository.create({
    email: parsed.data.email,
    passwordHash,
    termsAcceptedAt: new Date(),
  });

  await setSessionCookie({ userId: user.id, role: user.role });
  return apiOk({ userId: user.id, email: user.email, role: user.role }, 201);
}
