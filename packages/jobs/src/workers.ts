import path from "node:path";
import fs from "node:fs/promises";

import IORedis from "ioredis";
import { Worker } from "bullmq";

import {
  BackgroundJobRepository,
  createAiImageProvider,
  DesignRepository,
  generateMockupPngBuffer,
  MockupCacheRepository,
} from "@shirt/infrastructure";

import { AI_GENERATION_QUEUE, MOCKUP_GENERATION_QUEUE } from "./queue-config";
import type { AiGenerationJobData, MockupGenerationJobData } from "./producers";

const isFinalFailure = (attemptsMade: number, maxAttempts: number) => attemptsMade >= maxAttempts;

export const runAllWorkers = async () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to run workers");
  }

  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  const jobRepo = new BackgroundJobRepository();
  const designRepo = new DesignRepository();
  const mockupCacheRepo = new MockupCacheRepository();

  const mockupsDir =
    process.env.GENERATED_MOCKUPS_DIR ??
    path.join(process.cwd(), "apps", "web", "public", "generated", "mockups");

  const publicBase = process.env.PUBLIC_ASSET_BASE_URL ?? "";

  const aiWorker = new Worker<AiGenerationJobData>(
    AI_GENERATION_QUEUE,
    async (job) => {
      const { jobRecordId, designId, prompt } = job.data;
      await jobRepo.markActive(jobRecordId, job.attemptsMade);
      const ai = createAiImageProvider();
      const generated = await ai.generate(prompt);
      await designRepo.completeGeneration({ designId, imageUrl: generated.imageUrl });
      await jobRepo.markCompleted(jobRecordId, {
        imageUrl: generated.imageUrl,
        cached: generated.cached,
      });
    },
    { connection },
  );

  aiWorker.on("failed", async (job, err) => {
    if (!job?.id) return;
    const max = job.opts.attempts ?? 1;
    const msg = err instanceof Error ? err.message : String(err);
    if (isFinalFailure(job.attemptsMade, max)) {
      await jobRepo.markDeadLetter(job.id, msg, job.attemptsMade);
      await designRepo.failGeneration({ designId: job.data.designId, errorMessage: msg });
    } else {
      await jobRepo.markFailedRetrying(job.id, msg, job.attemptsMade);
    }
  });

  const mockupWorker = new Worker<MockupGenerationJobData>(
    MOCKUP_GENERATION_QUEUE,
    async (job) => {
      const { jobRecordId, cacheKey, productName, designImageUrl, textOverlay, productId, variantId, designId } =
        job.data;
      await jobRepo.markActive(jobRecordId, job.attemptsMade);

      const cached = await mockupCacheRepo.findByCacheKey(cacheKey);
      if (cached) {
        await jobRepo.markCompleted(jobRecordId, { previewImageUrl: cached.publicUrl, cacheHit: true });
        return;
      }

      const png = await generateMockupPngBuffer({
        designImageUrl,
        label: `${productName} preview`,
        textOverlay,
      });

      await fs.mkdir(mockupsDir, { recursive: true });
      const fileName = `${cacheKey}.png`;
      const filePath = path.join(mockupsDir, fileName);
      await fs.writeFile(filePath, png);

      const publicUrl = `${publicBase}/generated/mockups/${fileName}`;
      await mockupCacheRepo.upsert({
        cacheKey,
        publicUrl,
        productId,
        variantId,
        designId,
      });

      await jobRepo.markCompleted(jobRecordId, { previewImageUrl: publicUrl, cacheHit: false });
    },
    { connection },
  );

  mockupWorker.on("failed", async (job, err) => {
    if (!job?.id) return;
    const max = job.opts.attempts ?? 1;
    const msg = err instanceof Error ? err.message : String(err);
    if (isFinalFailure(job.attemptsMade, max)) {
      await jobRepo.markDeadLetter(job.id, msg, job.attemptsMade);
    } else {
      await jobRepo.markFailedRetrying(job.id, msg, job.attemptsMade);
    }
  });

  const shutdown = async () => {
    await aiWorker.close();
    await mockupWorker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  console.info("[workers] AI + mockup workers listening");
};
