-- Причина отказа: нижняя граница 30 символов вместо 100.
ALTER TABLE "ShowcaseResponse" DROP CONSTRAINT "ShowcaseResponse_rejection_reason";
ALTER TABLE "ShowcaseResponse"
ADD CONSTRAINT "ShowcaseResponse_rejection_reason"
CHECK (
  "status" <> 'REJECTED'
  OR (
    "rejectionReason" IS NOT NULL
    AND char_length("rejectionReason") BETWEEN 30 AND 500
  )
);

-- CreateTable
CREATE TABLE "ShowcaseMessage" (
    "id" UUID NOT NULL,
    "responseId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowcaseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowcaseMessage_responseId_createdAt_idx" ON "ShowcaseMessage"("responseId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShowcaseMessage" ADD CONSTRAINT "ShowcaseMessage_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ShowcaseResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseMessage" ADD CONSTRAINT "ShowcaseMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
