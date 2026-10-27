-- CreateEnum
CREATE TYPE "ProgrammingTaskDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "ProgrammingTask" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "ProgrammingTaskDifficulty" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProgrammingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingTaskVariant" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "language" "EditorLanguage" NOT NULL,
    "starterCode" TEXT NOT NULL,
    "harnessCode" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProgrammingTaskVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingTaskCase" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedOutput" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProgrammingTaskCase_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Session"
ADD COLUMN "programmingTaskId" UUID,
ADD COLUMN "programmingTaskSnapshot" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingTask_slug_key" ON "ProgrammingTask"("slug");

-- CreateIndex
CREATE INDEX "ProgrammingTask_isActive_idx" ON "ProgrammingTask"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingTaskVariant_taskId_language_key" ON "ProgrammingTaskVariant"("taskId", "language");

-- CreateIndex
CREATE INDEX "ProgrammingTaskVariant_language_idx" ON "ProgrammingTaskVariant"("language");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingTaskCase_taskId_position_key" ON "ProgrammingTaskCase"("taskId", "position");

-- CreateIndex
CREATE INDEX "Session_programmingTaskId_idx" ON "Session"("programmingTaskId");

-- AddForeignKey
ALTER TABLE "ProgrammingTaskVariant" ADD CONSTRAINT "ProgrammingTaskVariant_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProgrammingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingTaskCase" ADD CONSTRAINT "ProgrammingTaskCase_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProgrammingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_programmingTaskId_fkey" FOREIGN KEY ("programmingTaskId") REFERENCES "ProgrammingTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
