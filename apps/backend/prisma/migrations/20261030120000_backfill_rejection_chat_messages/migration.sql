-- Причина отказа теперь первое сообщение чата; переносим её для уже отклонённых откликов
INSERT INTO "ShowcaseMessage" ("id", "responseId", "senderId", "text", "createdAt")
SELECT gen_random_uuid(), r."id", p."userId", r."rejectionReason", COALESCE(r."reviewedAt", r."updatedAt")
FROM "ShowcaseResponse" r
JOIN "Profile" p ON p."id" = r."cardId"
WHERE r."status" = 'REJECTED' AND r."rejectionReason" IS NOT NULL;
