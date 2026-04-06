-- CreateEnum
CREATE TYPE "BackgroundJobType" AS ENUM ('ai_generation', 'mockup_generation');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('waiting', 'active', 'completed', 'failed', 'dead_letter');

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "popularityScore" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Product_popularityScore_idx" ON "Product"("popularityScore");

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Order_deletedAt_idx" ON "Order"("deletedAt");

-- AlterTable ReturnRequest
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ReturnRequest_deletedAt_idx" ON "ReturnRequest"("deletedAt");

-- CreateTable BackgroundJob
CREATE TABLE IF NOT EXISTS "BackgroundJob" (
    "id" TEXT NOT NULL,
    "type" "BackgroundJobType" NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'waiting',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "bullmqJobId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BackgroundJob_type_status_idx" ON "BackgroundJob"("type", "status");
CREATE INDEX IF NOT EXISTS "BackgroundJob_status_createdAt_idx" ON "BackgroundJob"("status", "createdAt");

-- CreateTable MockupCache
CREATE TABLE IF NOT EXISTS "MockupCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockupCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MockupCache_cacheKey_key" ON "MockupCache"("cacheKey");
CREATE INDEX IF NOT EXISTS "MockupCache_productId_variantId_designId_idx" ON "MockupCache"("productId", "variantId", "designId");
