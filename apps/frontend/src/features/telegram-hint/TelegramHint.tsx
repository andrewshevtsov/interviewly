"use client";

// Слой features: подсказка для тех, у кого не привязан Telegram - уведомления и ссылка на встречу
// приходят им на почту.
import { useTranslations } from "@/shared/i18n-context";
import { Card } from "@/shared/ui/card";
import { useCurrentUser } from "@/entities/user";

/**
 * Подсказка "Telegram не привязан".
 * @returns {import('react').ReactNode} Подсказка.
 */
export function TelegramHint() {
  const t = useTranslations("showcase");
  const currentUser = useCurrentUser();

  if (currentUser.data?.telegramId !== null) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">{t("telegramHintTitle")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("telegramHintText")}</p>
    </Card>
  );
}
