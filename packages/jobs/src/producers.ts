import { getAiGenerationQueue, getMockupGenerationQueue } from "./queues";

export type AiGenerationJobData = {
  jobRecordId: string;
  designId: string;
  prompt: string;
};

export type MockupGenerationJobData = {
  jobRecordId: string;
  userId: string;
  productId: string;
  variantId: string;
  designId: string;
  textOverlay?: string;
  cacheKey: string;
  productName: string;
  designImageUrl: string;
};

export const enqueueAiGenerationJob = async (data: AiGenerationJobData) => {
  const queue = getAiGenerationQueue();
  await queue.add("run", data, { jobId: data.jobRecordId });
};

export const enqueueMockupGenerationJob = async (data: MockupGenerationJobData) => {
  const queue = getMockupGenerationQueue();
  await queue.add("run", data, { jobId: data.jobRecordId });
};
