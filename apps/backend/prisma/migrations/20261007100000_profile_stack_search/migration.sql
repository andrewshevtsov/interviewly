-- Поиск по стеку без учёта регистра.

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "stackSearch" TEXT[];

-- Копия поддерживается триггером: сервис, сид, ручной SQL получают её бесплатно
CREATE OR REPLACE FUNCTION update_profile_stack_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW."stackSearch" := ARRAY(SELECT lower(tag) FROM unnest(NEW."stack") AS tag);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Profile_stackSearch_trigger"
BEFORE INSERT OR UPDATE OF "stack" ON "Profile"
FOR EACH ROW
EXECUTE FUNCTION update_profile_stack_search();

-- Заполняем существующие профили: триггер срабатывает, раз stack указан в SET
UPDATE "Profile" SET "stack" = "stack";

-- DropIndex / CreateIndex: фильтр теперь идёт по копии в нижнем регистре
DROP INDEX "Profile_stack_idx";
CREATE INDEX "Profile_stackSearch_idx" ON "Profile" USING GIN ("stackSearch");
