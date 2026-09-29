"use client";

// Слой entities: демо-задача комнаты - загрузка по HTTP и смена по WebSocket
import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { subscribeToSessionEvent } from "@/shared/api/realtime-client";

import type { DemoTask, DemoTaskState } from "./index";
import { sessionApi } from "./session-api";

// Совпадает с DEMO_TASK_CHANGED_EVENT на бэкенде
const DEMO_TASK_CHANGED_EVENT = "demo-task:changed";

/**
 * Ключ кэша демо-задачи сессии
 * @param {string} sessionId - UUID сессии
 * @returns {readonly string[]} Ключ для TanStack Query
 */
export function demoTaskQueryKey(sessionId: string) {
  return ["sessions", sessionId, "demo-task"] as const;
}

/**
 * Кладёт новую задачу в кэш: интервьюер получает её в ответе, остальные - по сокету
 * @param {QueryClient} queryClient - Клиент TanStack Query
 * @param {string} sessionId - UUID сессии
 * @param {DemoTask} task - Показанная задача
 * @returns {void}
 */
export function showDemoTask(queryClient: QueryClient, sessionId: string, task: DemoTask): void {
  queryClient.setQueryData<DemoTaskState>(demoTaskQueryKey(sessionId), { enabled: true, current: task });
}

/**
 * Демо-задача комнаты с подпиской на её смену
 * @param {string} sessionId - UUID сессии
 * @returns {import('@tanstack/react-query').UseQueryResult<DemoTaskState>} Запрос демо-задачи
 */
export function useDemoTask(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToSessionEvent<DemoTask>(
        sessionId,
        DEMO_TASK_CHANGED_EVENT,
        (task) => showDemoTask(queryClient, sessionId, task),
        () => void queryClient.invalidateQueries({ queryKey: demoTaskQueryKey(sessionId) }),
      ),
    [queryClient, sessionId],
  );

  /**
   * Загружает демо-задачу сессии
   * @returns {Promise<DemoTaskState>} Состояние демо-задачи
   */
  function getDemoTask() {
    return sessionApi.getDemoTask(sessionId);
  }

  return useQuery({ queryKey: demoTaskQueryKey(sessionId), queryFn: getDemoTask });
}
