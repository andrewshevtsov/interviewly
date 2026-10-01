-- CreateEnum
CREATE TYPE "EditorLanguage" AS ENUM ('PYTHON', 'JAVASCRIPT');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "editorLanguage" "EditorLanguage" NOT NULL DEFAULT 'PYTHON',
ADD COLUMN     "title" TEXT;
