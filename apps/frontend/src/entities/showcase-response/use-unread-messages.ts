"use client";

// Слой entities: новое в откликах: сообщения в чатах и события (новый отклик, решение, отмена).
// Опрос раз в 30 секунд.
import { useQuery } from "@tanstack/react-query";

import { showcaseResponseApi, showcaseResponseKeys } from "./showcase-response-api";
import type { UnreadMessages } from "./index";

const DEFAULT_POLL_INTERVAL_MS = 30_000;

/**
 * Новое в откликах: сообщения и ещё не просмотренные события.
 * Обновляется с заданным интервалом и при возврате на вкладку.
 * @param {number} [intervalMs] - Как часто опрашивать; по умолчанию 30 секунд.
 * @returns {object} `items` (непрочитанные), `countFor` (по одному отклику) и `total`
 */
export function useUnreadMessages(intervalMs: number = DEFAULT_POLL_INTERVAL_MS) {
  const messages = useQuery({
    queryKey: showcaseResponseKeys.unread,
    queryFn: showcaseResponseApi.unreadMessages,
    refetchInterval: intervalMs,
  });
  const newEvents = useQuery({
    queryKey: showcaseResponseKeys.newEvents,
    queryFn: showcaseResponseApi.newEvents,
    refetchInterval: intervalMs,
  });
  const items = messages.data ?? [];
  const events = newEvents.data ?? { incoming: 0, outgoing: 0 };

  return {
    items,

    /**
     * Сколько непрочитанных в чате по отклику.
     * @param {string} responseId - Идентификатор отклика.
     * @returns {number} Количество или 0.
     */
    countFor: (responseId: string): number => items.find((item) => item.responseId === responseId)?.count ?? 0,

    /**
     * Сумма нового (входящие или исходящие) или по всем откликам.
     * @param {UnreadMessages["box"]} [box] - Сторона; без неё считаются все отклики.
     * @returns {number} Непрочитанные сообщения плюс события по откликам (новый отклик, решение, отмена и т.д.)
     */
    total: (box?: UnreadMessages["box"]): number => {
      const unreadMessages = items.filter((item) => !box || item.box === box).reduce((sum, item) => sum + item.count, 0);
      const eventCount = box ? events[box] : events.incoming + events.outgoing;

      return unreadMessages + eventCount;
    },
  };
}
