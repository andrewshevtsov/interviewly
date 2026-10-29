ALTER TABLE "ProgrammingTaskVariant"
    ADD COLUMN "referenceSolution" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "createdById" UUID;

-- Default нужен только для совместимости с уже существующими вариантами.
ALTER TABLE "ProgrammingTaskVariant"
    ALTER COLUMN "referenceSolution" DROP DEFAULT;

CREATE INDEX "ProgrammingTaskVariant_createdById_idx"
    ON "ProgrammingTaskVariant"("createdById");

ALTER TABLE "ProgrammingTaskVariant"
    ADD CONSTRAINT "ProgrammingTaskVariant_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
