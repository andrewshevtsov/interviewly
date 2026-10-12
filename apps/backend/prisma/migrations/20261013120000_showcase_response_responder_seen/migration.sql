-- Автор отклика видел его состояние (решение владельца, отмену встречи) в списке «исходящие».
ALTER TABLE "ShowcaseResponse" ADD COLUMN "responderSeenAt" TIMESTAMPTZ(3);

-- Уже существующие события новыми не считаем
UPDATE "ShowcaseResponse" SET "responderSeenAt" = now(), "ownerSeenAt" = now();
