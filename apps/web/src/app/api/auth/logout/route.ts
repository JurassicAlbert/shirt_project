import { apiOk } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return apiOk({ loggedOut: true });
}
