-- Витрина участников: пользователь сам включает показ профиля.
ALTER TABLE "Profile" ADD COLUMN "showcaseVisible" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Profile_showcaseVisible_idx" ON "Profile"("showcaseVisible");

-- GIN ускоряет фильтр по стеку (hasSome / &&)
CREATE INDEX "Profile_stack_idx" ON "Profile" USING GIN ("stack");
