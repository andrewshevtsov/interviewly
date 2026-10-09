-- Отклик теперь несёт время встречи и связан с созданной сессией.

-- AlterEnum
ALTER TYPE "ShowcaseResponseStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ShowcaseResponseStatus" ADD VALUE 'EXPIRED';

-- Функция ещё не выпускалась: отклики без времени встречи не переносим.
DELETE FROM "ShowcaseResponse";

-- AlterTable
ALTER TABLE "ShowcaseResponse"
    ADD COLUMN "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    ADD COLUMN "timeMismatch" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "sessionId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseResponse_sessionId_key" ON "ShowcaseResponse"("sessionId");

-- AddForeignKey
ALTER TABLE "ShowcaseResponse" ADD CONSTRAINT "ShowcaseResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Отмена сессии до начала: кто и почему.
ALTER TABLE "Session"
    ADD COLUMN "cancelledById" UUID,
    ADD COLUMN "cancelReason" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
