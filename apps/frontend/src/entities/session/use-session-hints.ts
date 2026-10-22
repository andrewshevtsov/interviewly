"use client";

// Слой entities: AI-подсказки сессии - начальная загрузка по HTTP и обновления по WebSocket
import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { subscribeToSessionEvent } from "@/shared/api/realtime-client";
import type { ApiSessionHint, SessionHints } from "./index";
import { sessionApi } from "./session-api";

// Совпадает с бэком
const HINT_CREATED_EVENT = "hint:created";

/**
 * Ключ кэша подсказок сессии
 * @param {string} sessionId - UUID сессии
 * @returns {readonly string[]} Ключ для TanStack Query
 */
export function sessionHintsQueryKey(sessionId: string) {
  return ["sessions", sessionId, "hints"] as const;
}

/**
 * Добавляет подсказку в кэш, если её там ещё нет: автор получает её и в ответе на запрос, и по сокету
 * @param {QueryClient} queryClient - Клиент TanStack Query
 * @param {string} sessionId - UUID сессии
 * @param {ApiSessionHint} hint - Новая подсказка
 * @returns {void}
 */
export function appendSessionHint(queryClient: QueryClient, sessionId: string, hint: ApiSessionHint): void {
  queryClient.setQueryData<SessionHints>(sessionHintsQueryKey(sessionId), (current) => {
    if (!current || current.hints.some((item) => item.id === hint.id)) {
      return current;
    }

    const hints = [...current.hints, hint];

    return { ...current, hints, remaining: Math.max(0, current.limit - hints.length) };
  });
}

/**
 * Подсказки сессии с подпиской на новые: пока компонент смонтирован, сокет состоит в комнате
 * сессии. После переподключения список перечитывается - события за время обрыва не теряются
 * @param {string} sessionId - UUID сессии.
 * @returns {import('@tanstack/react-query').UseQueryResult<SessionHints>} Запрос подсказок
 */
export function useSessionHints(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToSessionEvent<ApiSessionHint>(
        sessionId,
        HINT_CREATED_EVENT,
        (hint) => appendSessionHint(queryClient, sessionId, hint),
        () => void queryClient.invalidateQueries({ queryKey: sessionHintsQueryKey(sessionId) }),
      ),
    [queryClient, sessionId],
  );

  /**
   * Загружает подсказки сессии
   * @returns {Promise<SessionHints>} Подсказки, лимит и остаток
   */
  function listHints() {
    return sessionApi.listHints(sessionId);
  }

  return useQuery({ queryKey: sessionHintsQueryKey(sessionId), queryFn: listHints });
}
