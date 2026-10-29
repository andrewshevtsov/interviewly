ALTER TABLE "ProgrammingTask"
    ADD COLUMN "createdById" UUID;

CREATE INDEX "ProgrammingTask_createdById_idx"
    ON "ProgrammingTask"("createdById");

ALTER TABLE "ProgrammingTask"
    ADD CONSTRAINT "ProgrammingTask_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
