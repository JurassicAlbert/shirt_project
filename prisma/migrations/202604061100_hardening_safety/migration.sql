-- DesignStatus enum migration
ALTER TYPE "DesignStatus" RENAME TO "DesignStatus_old";
CREATE TYPE "DesignStatus" AS ENUM ('pending', 'completed', 'failed', 'moderated');
ALTER TABLE "Design"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "DesignStatus"
    USING (
      CASE
        WHEN "status"::text = 'ready' THEN 'completed'
        WHEN "status"::text = 'draft' THEN 'pending'
        WHEN "status"::text = 'timed_out' THEN 'failed'
        ELSE "status"::text
      END
    )::"DesignStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending';
DROP TYPE "DesignStatus_old";

-- OrderStatus enum migration
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('created', 'payment_pending', 'paid', 'failed', 'shipped', 'completed');
ALTER TABLE "Order"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus"
    USING (
      CASE
        WHEN "status"::text = 'pending_payment' THEN 'payment_pending'
        WHEN "status"::text = 'in_production' THEN 'paid'
        WHEN "status"::text = 'delivered' THEN 'completed'
        WHEN "status"::text = 'cancelled' THEN 'failed'
        ELSE "status"::text
      END
    )::"OrderStatus",
  ALTER COLUMN "status" SET DEFAULT 'created';
DROP TYPE "OrderStatus_old";

ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

CREATE TABLE IF NOT EXISTS "OrderTransitionLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus" NOT NULL,
  "toStatus" "OrderStatus" NOT NULL,
  "actor" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderTransitionLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrderTransitionLog_orderId_createdAt_idx" ON "OrderTransitionLog"("orderId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "OrderTransitionLog"
    ADD CONSTRAINT "OrderTransitionLog_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "IdempotencyRecord" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "responseJson" JSONB,
  "statusCode" INTEGER,
  "inFlight" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyRecord_scope_key_key" ON "IdempotencyRecord"("scope", "key");
CREATE INDEX IF NOT EXISTS "IdempotencyRecord_scope_createdAt_idx" ON "IdempotencyRecord"("scope", "createdAt");

DO $$ BEGIN
  CREATE UNIQUE INDEX "SearchEmbedding_sourceType_sourceId_key" ON "SearchEmbedding"("sourceType", "sourceId");
EXCEPTION WHEN duplicate_table THEN NULL;
WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "PaymentAttempt_providerRef_idx" ON "PaymentAttempt"("providerRef");
