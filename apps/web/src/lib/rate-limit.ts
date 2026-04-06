import { getOptionalRedis } from "@shirt/jobs";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;

const memoryConsume = (key: string, limit: number) => {
  const now = Date.now();
  let b = memoryBuckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    memoryBuckets.set(key, b);
  }
  if (b.count >= limit) {
    return { allowed: false as const, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true as const };
};

const redisConsume = async (key: string, limit: number) => {
  try {
    const redis = getOptionalRedis();
    if (!redis) return null;
    const k = `rl:${key}`;
    const n = await redis.incr(k);
    if (n === 1) {
      await redis.pexpire(k, WINDOW_MS);
    }
    if (n > limit) {
      const ttl = await redis.pttl(k);
      return { allowed: false as const, retryAfterSec: Math.max(1, Math.ceil(ttl / 1000)) };
    }
    return { allowed: true as const };
  } catch {
    return null;
  }
};

export const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; message: string };

/**
 * Fixed window per minute: `limit` requests per `scope` key (IP and/or user).
 */
export const checkRateLimit = async (input: {
  scope: string;
  ip: string;
  userId?: string;
  ipLimit: number;
  userLimit?: number;
}): Promise<RateLimitResult> => {
  const ipKey = `${input.scope}:ip:${input.ip}`;
  const redisIp = await redisConsume(ipKey, input.ipLimit);
  if (redisIp && !redisIp.allowed) {
    return { ok: false, retryAfterSec: redisIp.retryAfterSec, message: "Too many requests (IP)" };
  }
  if (!redisIp) {
    const m = memoryConsume(ipKey, input.ipLimit);
    if (!m.allowed) {
      return { ok: false, retryAfterSec: m.retryAfterSec, message: "Too many requests (IP)" };
    }
  }

  if (input.userId && input.userLimit) {
    const userKey = `${input.scope}:user:${input.userId}`;
    const redisUser = await redisConsume(userKey, input.userLimit);
    if (redisUser && !redisUser.allowed) {
      return { ok: false, retryAfterSec: redisUser.retryAfterSec, message: "Too many requests (user)" };
    }
    if (!redisUser) {
      const m = memoryConsume(userKey, input.userLimit);
      if (!m.allowed) {
        return { ok: false, retryAfterSec: m.retryAfterSec, message: "Too many requests (user)" };
      }
    }
  }

  return { ok: true };
};
