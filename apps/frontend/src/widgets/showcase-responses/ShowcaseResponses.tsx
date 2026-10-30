"use client";

// Слой widgets: отклики - вкладки "входящие" и "исходящие".
import { useState } from "react";

import { useGuestRedirect } from "@/shared/api/use-guest-redirect";
import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { useAuthStore } from "@/shared/model/auth-store";
import { CancelMeeting } from "@/features/cancel-meeting";
import { IncomingResponses } from "@/features/manage-incoming-responses";
import { OutgoingResponses } from "@/features/manage-outgoing-responses";
import { RespondToCard, type RespondTarget } from "@/features/respond-to-card";
import { ResponseChat } from "@/features/response-chat";
import { TelegramHint } from "@/features/telegram-hint";
import { UnreadResponsesBadge } from "@/features/unread-responses";
import {
  canRespondAgain,
  useUnreadMessages,
  type IncomingResponse,
  type OutgoingResponse,
} from "@/entities/showcase-response";

type Tab = "incoming" | "outgoing";

const TABS: Tab[] = ["incoming", "outgoing"];

const SCREEN_POLL_INTERVAL_MS = 10_000;

/**
 * Карточка для повторного отклика прямо из истории: у исходящих это карточка, на которую откликались,
 * у входящих - карточка откликнувшегося. `null`, если откликнуться снова нельзя или карточки нет.
 * @param {IncomingResponse | OutgoingResponse} response - Отклик из любого из двух списков.
 * @returns {RespondTarget | null} Карточка для формы отклика.
 */
function getRespondTarget(response: IncomingResponse | OutgoingResponse): RespondTarget | null {
  if (!canRespondAgain(response, new Date())) {
    return null;
  }

  if ("card" in response) {
    return { id: response.card.id, name: response.card.name, myResponse: null };
  }

  const { cardId, name } = response.responder;

  return cardId ? { id: cardId, name, myResponse: null } : null;
}

/**
 * Действия под откликом: чат, отмена назначенной встречи и повторный отклик.
 * @param {IncomingResponse | OutgoingResponse} response - Отклик из любого из двух списков.
 * @returns {import('react').ReactNode} Кнопки чата, отмены и отклика или `null`, пока отклик не обработан.
 */
function renderDecidedActions(response: IncomingResponse | OutgoingResponse) {
  const hasChat = response.status === "ACCEPTED" || response.status === "REJECTED";
  const canCancelMeeting =
    response.status === "ACCEPTED" &&
    response.sessionId !== null &&
    (response.sessionStatus === "SCHEDULED" || response.sessionStatus === "READY");

  const respondTarget = getRespondTarget(response);

  return (
    <>
      {hasChat && <ResponseChat responseId={response.id} />}
      {canCancelMeeting && response.sessionId && <CancelMeeting sessionId={response.sessionId} />}
      {respondTarget && <RespondToCard participant={respondTarget} />}
    </>
  );
}

/**
 * Страница откликов: вкладки входящих и исходящих.
 * @returns {import('react').ReactNode} Вкладки с откликами, либо сообщение о загрузке при восстановлении сессии.
 */
export function ShowcaseResponses() {
  useGuestRedirect();
  const [tab, setTab] = useState<Tab>("incoming");
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const isAuthenticated = useAuthStore((state) => state.status === "authenticated");

  useUnreadMessages(SCREEN_POLL_INTERVAL_MS);

  if (!isAuthenticated) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <TelegramHint />

      <div role="tablist" className="flex gap-2 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item === "incoming" ? t("tabIncoming") : t("tabOutgoing")}
            <UnreadResponsesBadge box={item} />
          </button>
        ))}
      </div>

      {tab === "incoming"
        ? <IncomingResponses renderActions={renderDecidedActions} />
        : <OutgoingResponses renderActions={renderDecidedActions} />}
    </div>
  );
}
