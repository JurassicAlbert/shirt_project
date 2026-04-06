import type { DefaultJobOptions } from "bullmq";

export const AI_GENERATION_QUEUE = "ai-generation";
export const MOCKUP_GENERATION_QUEUE = "mockup-generation";

/** Exponential backoff: delay * 2^(attempts-1), capped */
export const defaultJobOptions: DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};
