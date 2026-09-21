// Слой widgets: карточка с уведомлением о Telegram-боте.
import { Card } from "@/shared/ui/card";
import { getServerTranslations } from "@/shared/i18n-server";

/**
 * Sidebar card explaining what the Telegram bot notifies the user about.
 * @returns {import('react').ReactNode} The Telegram notice card.
 */
export async function TelegramNotice() {
  const t = await getServerTranslations("notification");

  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {t("telegramTitle")}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{t("telegramDescription")}</p>
    </Card>
  );
}
