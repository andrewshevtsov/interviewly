-- AlterEnum
ALTER TYPE "EditorLanguage" ADD VALUE 'TYPESCRIPT';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "demoTaskIndex" INTEGER,
ADD COLUMN     "task" TEXT,
ALTER COLUMN "editorLanguage" SET DEFAULT 'TYPESCRIPT';

-- CreateTable
CREATE TABLE "SessionHint" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionHint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionHint_sessionId_order_key" ON "SessionHint"("sessionId", "order");

-- AddForeignKey
ALTER TABLE "SessionHint" ADD CONSTRAINT "SessionHint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionHint" ADD CONSTRAINT "SessionHint_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

