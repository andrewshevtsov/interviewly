-- Profile становится профилем конкретного пользователя (1:1 с User).
-- Имя, email и telegram теперь берутся из User, дублирующие колонки удаляются.

-- Старые анкеты без владельца: сначала пробуем привязать по email,
-- оставшиеся без пользователя удаляем - показывать их на витрине некому.
UPDATE "Profile" p
SET "userId" = u."id"
FROM "User" u
WHERE p."userId" IS NULL AND lower(u."email") = lower(p."email");

DELETE FROM "Profile" WHERE "userId" IS NULL;

-- Несколько анкет одного пользователя: оставляем самую свежую.
DELETE FROM "Profile"
WHERE "id" IN (
    SELECT "id" FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "updatedAt" DESC) AS "position"
        FROM "Profile"
    ) ranked
    WHERE ranked."position" > 1
);

-- DropIndex
DROP INDEX "Profile_email_key";
DROP INDEX "Profile_email_idx";

-- AlterTable
ALTER TABLE "Profile"
    DROP COLUMN "name",
    DROP COLUMN "email",
    DROP COLUMN "telegram",
    ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
