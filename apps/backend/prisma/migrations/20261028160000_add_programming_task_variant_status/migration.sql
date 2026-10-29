CREATE TYPE "ProgrammingTaskVariantStatus" AS ENUM (
    'DRAFT',
    'VERIFYING',
    'VERIFIED',
    'FAILED'
);

ALTER TABLE "ProgrammingTaskVariant"
    ADD COLUMN "status" "ProgrammingTaskVariantStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "verifiedAt" TIMESTAMPTZ(3),
    ADD COLUMN "lastVerificationError" TEXT;

-- Существующие варианты уже используются в сессиях и считаются проверенными.
UPDATE "ProgrammingTaskVariant"
SET
    "status" = 'VERIFIED',
    "verifiedAt" = CURRENT_TIMESTAMP;

CREATE INDEX "ProgrammingTaskVariant_status_idx"
    ON "ProgrammingTaskVariant"("status");
