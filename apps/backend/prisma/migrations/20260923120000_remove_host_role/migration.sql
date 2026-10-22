-- Роль HOST дублировала Session.ownerId: права теперь проверяются по владельцу,
-- а сам владелец участвует в комнате как INTERVIEWER
UPDATE "SessionParticipant" SET "role" = 'INTERVIEWER' WHERE "role" = 'HOST';
UPDATE "SessionAccessRequest" SET "requestedRole" = 'INTERVIEWER' WHERE "requestedRole" = 'HOST';

-- AlterEnum
BEGIN;
CREATE TYPE "SessionParticipantRole_new" AS ENUM ('INTERVIEWER', 'CANDIDATE');
ALTER TABLE "SessionParticipant" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "SessionAccessRequest" ALTER COLUMN "requestedRole" DROP DEFAULT;
ALTER TABLE "SessionParticipant" ALTER COLUMN "role" TYPE "SessionParticipantRole_new" USING ("role"::text::"SessionParticipantRole_new");
ALTER TABLE "SessionAccessRequest" ALTER COLUMN "requestedRole" TYPE "SessionParticipantRole_new" USING ("requestedRole"::text::"SessionParticipantRole_new");
ALTER TYPE "SessionParticipantRole" RENAME TO "SessionParticipantRole_old";
ALTER TYPE "SessionParticipantRole_new" RENAME TO "SessionParticipantRole";
DROP TYPE "public"."SessionParticipantRole_old";
ALTER TABLE "SessionParticipant" ALTER COLUMN "role" SET DEFAULT 'CANDIDATE';
ALTER TABLE "SessionAccessRequest" ALTER COLUMN "requestedRole" SET DEFAULT 'CANDIDATE';
COMMIT;
