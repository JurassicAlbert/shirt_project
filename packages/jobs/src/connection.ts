import IORedis from "ioredis";

declare global {
  var __shirtBullRedis: IORedis | undefined;
}

export const getRedisUrl = () => process.env.REDIS_URL ?? "";

export const createRedisConnection = () => {
  const url = getRedisUrl();
  if (!url) {
    throw new Error("REDIS_URL is required for BullMQ job queues");
  }
  return new IORedis(url, { maxRetriesPerRequest: null });
};

export const getSharedRedis = () => {
  if (!getRedisUrl()) return null;
  if (!globalThis.__shirtBullRedis) {
    globalThis.__shirtBullRedis = createRedisConnection();
  }
  return globalThis.__shirtBullRedis;
};

/** Single connection for BullMQ Queue + Worker (recommended by BullMQ). */
export const getBullConnection = () => {
  const conn = getSharedRedis();
  if (!conn) {
    throw new Error("REDIS_URL is required for BullMQ");
  }
  return conn;
};

/** Redis without throwing (e.g. rate limiting when Redis is optional in dev). */
export const getOptionalRedis = (): IORedis | null => getSharedRedis();
