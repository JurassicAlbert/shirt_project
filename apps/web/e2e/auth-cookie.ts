import type { APIResponse, BrowserContext } from "@playwright/test";

/** Next may emit multiple Set-Cookie lines; joined headers break on Expires commas — parse each line. */
export async function addSessionCookieFromResponse(
  context: BrowserContext,
  res: APIResponse,
  origin = "http://localhost:3000",
): Promise<void> {
  const lines = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value);
  for (const raw of lines) {
    const m = /^session_token=([^;]+)/.exec(raw);
    if (m?.[1]) {
      await context.addCookies([
        {
          name: "session_token",
          value: m[1],
          url: origin,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      return;
    }
  }
}
