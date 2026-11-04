-- Тест-кейсы зависят от языка выполнения и принадлежат конкретному варианту.
-- Существующие общие кейсы размножаются для каждого языкового варианта задачи.
CREATE TABLE "ProgrammingTaskCase_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedOutput" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProgrammingTaskCase_new_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProgrammingTaskCase_new" (
    "variantId",
    "position",
    "name",
    "input",
    "expectedOutput",
    "createdAt",
    "updatedAt"
)
SELECT
    variant."id",
    test_case."position",
    test_case."name",
    test_case."input",
    test_case."expectedOutput",
    test_case."createdAt",
    test_case."updatedAt"
FROM "ProgrammingTaskCase" AS test_case
INNER JOIN "ProgrammingTaskVariant" AS variant
    ON variant."taskId" = test_case."taskId";

DROP TABLE "ProgrammingTaskCase";
ALTER TABLE "ProgrammingTaskCase_new" RENAME TO "ProgrammingTaskCase";

ALTER TABLE "ProgrammingTaskCase"
    RENAME CONSTRAINT "ProgrammingTaskCase_new_pkey" TO "ProgrammingTaskCase_pkey";

CREATE UNIQUE INDEX "ProgrammingTaskCase_variantId_position_key"
    ON "ProgrammingTaskCase"("variantId", "position");

ALTER TABLE "ProgrammingTaskCase"
    ADD CONSTRAINT "ProgrammingTaskCase_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProgrammingTaskVariant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
