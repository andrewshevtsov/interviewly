-- CreateEnum
CREATE TYPE "SessionAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
CREATE INDEX "SessionParticipant_userId_leftAt_idx" ON "SessionParticipant"("userId", "leftAt");

-- CreateTable
CREATE TABLE "SessionAccessRequest" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "status" "SessionAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedRole" "SessionParticipantRole" NOT NULL DEFAULT 'CANDIDATE',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SessionAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionAccessRequest_sessionId_status_idx" ON "SessionAccessRequest"("sessionId", "status");

-- CreateIndex
CREATE INDEX "SessionAccessRequest_requesterId_idx" ON "SessionAccessRequest"("requesterId");

-- AddForeignKey
ALTER TABLE "SessionAccessRequest" ADD CONSTRAINT "SessionAccessRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAccessRequest" ADD CONSTRAINT "SessionAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAccessRequest" ADD CONSTRAINT "SessionAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Не больше одной PENDING-заявки на пару (session, requester)
CREATE UNIQUE INDEX "SessionAccessRequest_pending_unique"
ON "SessionAccessRequest" ("sessionId", "requesterId")
WHERE "status" = 'PENDING';
