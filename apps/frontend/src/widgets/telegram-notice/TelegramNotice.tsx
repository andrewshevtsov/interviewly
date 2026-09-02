// Слой widgets: карточка с уведомлением о Telegram-боте.
import { Card } from "@/shared/ui/card";

/**
 * Sidebar card explaining what the Telegram bot notifies the user about.
 * @returns {import('react').ReactNode} The Telegram notice card.
 */
export function TelegramNotice() {
  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Telegram-уведомления</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Бот пришлёт сообщение, когда сессия будет запущена или на вашу карточку откликнутся.
      </p>
    </Card>
  );
}
