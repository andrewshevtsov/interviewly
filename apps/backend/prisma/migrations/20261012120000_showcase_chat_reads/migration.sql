-- CreateTable
CREATE TABLE "ShowcaseChatRead" (
    "responseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ShowcaseChatRead_pkey" PRIMARY KEY ("responseId","userId")
);

-- AddForeignKey
ALTER TABLE "ShowcaseChatRead" ADD CONSTRAINT "ShowcaseChatRead_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ShowcaseResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseChatRead" ADD CONSTRAINT "ShowcaseChatRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
