-- CreateEnum
CREATE TYPE "ShowcaseResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ShowcaseResponse" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "responderId" UUID NOT NULL,
    "role" "SessionParticipantRole" NOT NULL,
    "status" "ShowcaseResponseStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ShowcaseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowcaseResponse_cardId_status_idx" ON "ShowcaseResponse"("cardId", "status");

-- CreateIndex
CREATE INDEX "ShowcaseResponse_responderId_createdAt_idx" ON "ShowcaseResponse"("responderId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShowcaseResponse" ADD CONSTRAINT "ShowcaseResponse_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseResponse" ADD CONSTRAINT "ShowcaseResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Не больше одного отклика в ожидании от одного человека на одну карточку:
-- защищает от гонки двух одновременных запросов (повторные отклики после
-- отказа разрешены, поэтому обычный UNIQUE не подходит).
CREATE UNIQUE INDEX "ShowcaseResponse_pending_unique"
ON "ShowcaseResponse"("cardId", "responderId")
WHERE "status" = 'PENDING';

-- При отказе причина обязательна и должна быть 100-500 символов.
ALTER TABLE "ShowcaseResponse"
ADD CONSTRAINT "ShowcaseResponse_rejection_reason"
CHECK (
  "status" <> 'REJECTED'
  OR (
    "rejectionReason" IS NOT NULL
    AND char_length("rejectionReason") BETWEEN 100 AND 500
  )
);
