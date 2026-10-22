-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('BUSINESS', 'MOCK');

-- CreateEnum
CREATE TYPE "SessionAccess" AS ENUM ('OPEN', 'PASSWORD', 'INVITE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'READY', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'BUSINESS',
    "access" "SessionAccess" NOT NULL DEFAULT 'INVITE',
    "passwordHash" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'READY',
    "statusUpdatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "endedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(3),
    "leftAt" TIMESTAMPTZ(3),
    "reconnectCount" INTEGER NOT NULL DEFAULT 0,
    "offlineSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("userId","sessionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "avatarPath" TEXT,
    "timeZone" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "registrationCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusUpdatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckSessionAccess 
ALTER TABLE "Session"
ADD CONSTRAINT "Session_password_required"
CHECK (
  "access" <> 'PASSWORD'
  OR (
    "passwordHash" IS NOT NULL
    AND length("passwordHash") > 0
  )
);

-- CheckSessionTimeOrder
ALTER TABLE "Session"
ADD CONSTRAINT "Session_dates_order"
CHECK (
  "startedAt" IS NULL
  OR "endedAt" IS NULL
  OR "startedAt" < "endedAt"
);

-- CheckSessionParticipantTimeOrder
ALTER TABLE "SessionParticipant"
ADD CONSTRAINT "SessionParticipant_dates_order"
CHECK (
  "joinedAt" IS NULL
  OR "leftAt" IS NULL
  OR "joinedAt" < "leftAt"
);

-- StatusUpdateFunction
CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    NEW."statusUpdatedAt" = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TriggerStatusUpdateSession
CREATE TRIGGER "Session_statusUpdatedAt_trigger"
BEFORE UPDATE ON "Session"
FOR EACH ROW
EXECUTE FUNCTION update_status_timestamp();

-- TriggerStatusUpdateUser
CREATE TRIGGER "User_statusUpdatedAt_trigger"
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_status_timestamp();