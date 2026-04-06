import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("rate limit (memory fallback)", () => {
  it("blocks after exceeding IP limit", async () => {
    const scope = `rl_ip_${Date.now()}_${Math.random()}`;
    const ip = "203.0.113.50";
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit({ scope, ip, ipLimit: 5 });
      expect(r.ok).toBe(true);
    }
    const blocked = await checkRateLimit({ scope, ip, ipLimit: 5 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("applies separate user bucket when configured", async () => {
    const scope = `rl_user_${Date.now()}_${Math.random()}`;
    const ip = "203.0.113.51";
    const userId = "user-1";
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit({
        scope,
        ip,
        userId,
        ipLimit: 100,
        userLimit: 3,
      });
      expect(r.ok).toBe(true);
    }
    const blocked = await checkRateLimit({
      scope,
      ip,
      userId,
      ipLimit: 100,
      userLimit: 3,
    });
    expect(blocked.ok).toBe(false);
  });
});
