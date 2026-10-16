"use client";

// Слой widgets: витрина участников - подсказка про Telegram, поиск с фильтрами и карточки
// с кнопкой отклика.
import { useGuestRedirect } from "@/shared/api/use-guest-redirect";
import { useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";
import { ParticipantBrowser } from "@/features/browse-participants";
import { RespondToCard } from "@/features/respond-to-card";
import { TelegramHint } from "@/features/telegram-hint";
import type { Participant } from "@/entities/participant";

/**
 * Кнопка действия на карточке витрины: отклик.
 * @param {Participant} participant - Карточка участника.
 * @returns {import('react').ReactNode} Кнопка отклика.
 */
function renderRespondAction(participant: Participant) {
  return <RespondToCard participant={participant} />;
}

/**
 * Витрина участников.
 * @returns {import('react').ReactNode} Витрина, либо сообщение о загрузке, пока восстанавливается сессия.
 */
export function ParticipantShowcase() {
  useGuestRedirect();
  const common = useTranslations("common");
  const isAuthenticated = useAuthStore((state) => state.status === "authenticated");

  if (!isAuthenticated) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <TelegramHint />
      <ParticipantBrowser renderAction={renderRespondAction} />
    </div>
  );
}
