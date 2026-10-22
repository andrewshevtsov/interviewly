"use client";

// Слой entities: открыт ли редактор. Флаг живёт в состоянии пользователя
// (GET /sessions/:id/me), а переключение приходит всем по WebSocket
import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import { subscribeToSessionEvent } from "@/shared/api/realtime-client";

import type { EditorState, MySessionState } from "./index";

// Совпадает с EDITOR_TOGGLED_EVENT на бэке
const EDITOR_TOGGLED_EVENT = "editor:toggled";

/**
 * Ключ кэша состояния пользователя в сессии
 * @param {string} sessionId - UUID сессии
 * @returns {readonly string[]} Ключ для TanStack Query
 */
function myStateQueryKey(sessionId: string) {
  return ["sessions", sessionId, "me"] as const;
}

/**
 * Кладёт новое состояние редактора в кэш: интервьюер получает его в ответе, остальные по сокету.
 * Запущенный опрос отменяется, иначе он вернёт старое значение поверх нового
 * @param {QueryClient} queryClient - Клиент TanStack Query
 * @param {string} sessionId - UUID сессии
 * @param {boolean} open - Открыт ли редактор
 * @returns {Promise<void>} Завершается, когда кэш обновлён
 */
export async function applyEditorOpen(queryClient: QueryClient, sessionId: string, open: boolean): Promise<void> {
  const queryKey = myStateQueryKey(sessionId);
  await queryClient.cancelQueries({ queryKey });
  queryClient.setQueryData<MySessionState>(queryKey, (state) => state && { ...state, editorOpen: open });
}

/**
 * Подписывает комнату на открытие и закрытие редактора
 * @param {string} sessionId - UUID сессии
 * @returns {void}
 */
export function useEditorOpenSync(sessionId: string): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToSessionEvent<EditorState>(
        sessionId,
        EDITOR_TOGGLED_EVENT,
        (payload) => applyEditorOpen(queryClient, sessionId, payload.open),
        () => queryClient.invalidateQueries({ queryKey: myStateQueryKey(sessionId) }),
      ),
    [queryClient, sessionId],
  );
}
