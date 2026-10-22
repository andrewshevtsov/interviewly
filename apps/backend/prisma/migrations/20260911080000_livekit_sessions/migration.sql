-- CreateEnum
CREATE TYPE "SessionParticipantRole" AS ENUM ('HOST', 'INTERVIEWER', 'CANDIDATE');

-- AlterTable: LiveKit room name (backfill existing rows from id)
ALTER TABLE "Session" ADD COLUMN "livekitRoomName" TEXT;

UPDATE "Session" SET "livekitRoomName" = "id"::text WHERE "livekitRoomName" IS NULL;

ALTER TABLE "Session" ALTER COLUMN "livekitRoomName" SET NOT NULL;

CREATE UNIQUE INDEX "Session_livekitRoomName_key" ON "Session"("livekitRoomName");

-- AlterTable: participant role for LiveKit grants / metadata
ALTER TABLE "SessionParticipant" ADD COLUMN "role" "SessionParticipantRole" NOT NULL DEFAULT 'CANDIDATE';
