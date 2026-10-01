"use client";

// Слой views: экран между завершением интервью и переходом на фидбек - чтобы участник не
// смотрел на отключённую комнату, пока шлюз уводит его на экран отзыва
import { Loader2 } from "lucide-react";

import { useTranslations } from "@/shared/i18n-context";

/**
 * Сообщение "интервью завершено" со спиннером на время перехода к экрану фидбека
 * @returns {import('react').ReactNode} Экран ожидания перехода
 */
export function SessionEndedNotice() {
  const t = useTranslations("session");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-lg font-semibold">{t("sessionEnded")}</p>
      <p className="text-muted-foreground">{t("redirectingToFeedback")}</p>
    </main>
  );
}
