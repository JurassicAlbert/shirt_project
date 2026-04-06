import { Queue } from "bullmq";
import { getBullConnection, getRedisUrl } from "./connection";
import { AI_GENERATION_QUEUE, MOCKUP_GENERATION_QUEUE, defaultJobOptions } from "./queue-config";

declare global {
  var __shirtAiQueue: Queue | undefined;
  var __shirtMockupQueue: Queue | undefined;
}

const requireRedis = () => {
  if (!getRedisUrl()) {
    throw new Error("REDIS_URL must be set to use job queues (start Redis via docker compose)");
  }
};

export const getAiGenerationQueue = () => {
  requireRedis();
  if (!globalThis.__shirtAiQueue) {
    globalThis.__shirtAiQueue = new Queue(AI_GENERATION_QUEUE, {
      connection: getBullConnection(),
      defaultJobOptions,
    });
  }
  return globalThis.__shirtAiQueue;
};

export const getMockupGenerationQueue = () => {
  requireRedis();
  if (!globalThis.__shirtMockupQueue) {
    globalThis.__shirtMockupQueue = new Queue(MOCKUP_GENERATION_QUEUE, {
      connection: getBullConnection(),
      defaultJobOptions,
    });
  }
  return globalThis.__shirtMockupQueue;
};
