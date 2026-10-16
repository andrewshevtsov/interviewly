-- Владелец карточки видел отклик: пока NULL, отклик считается новым (значок на «Мои отклики»).
ALTER TABLE "ShowcaseResponse" ADD COLUMN "ownerSeenAt" TIMESTAMPTZ(3);

-- Уже существующие отклики новыми не считаем
UPDATE "ShowcaseResponse" SET "ownerSeenAt" = now();
