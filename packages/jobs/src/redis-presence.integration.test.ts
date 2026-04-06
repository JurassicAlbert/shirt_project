import { afterAll, beforeAll, describe, expect, it } from "vitest";
import IORedis from "ioredis";

const url = process.env.REDIS_URL;

describe.skipIf(!url)("Redis persistence (job recovery substrate)", () => {
  let redis: IORedis;

  beforeAll(() => {
    redis = new IORedis(url!, { maxRetriesPerRequest: null });
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("retains keys across reconnect simulation", async () => {
    const key = `shirt:test:recovery:${Date.now()}`;
    await redis.set(key, "pending", "EX", 60);
    const second = new IORedis(url!, { maxRetriesPerRequest: null });
    const v = await second.get(key);
    await second.quit();
    expect(v).toBe("pending");
    await redis.del(key);
  });
});
