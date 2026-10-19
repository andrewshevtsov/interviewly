"use client";

// Слой features: один раз сохраняет часовой пояс браузера в профиль. По нему backend показывает время
// встреч в уведомлениях; без него время приходит в UTC.
import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/shared/model/auth-store";
import { CURRENT_USER_QUERY_KEY, useCurrentUser, userApi } from "@/entities/user";

import { needsTimeZoneSync } from "./needs-time-zone-sync";

/**
 * Отправляет пояс браузера, если у вошедшего пользователя он не задан.
 * @returns {null} Ничего не отображает.
 */
function SyncForSignedInUser(): null {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const attempted = useRef(false);

  const mutation = useMutation({
    mutationFn: userApi.setTimeZone,
    /**
     * Кладёт обновлённого пользователя в кеш.
     * @param {import('@/entities/user').CurrentUser} saved - Пользователь после сохранения.
     * @returns {void}
     */
    onSuccess: (saved) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, saved);
    },
  });

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!currentUser.data || attempted.current || !needsTimeZoneSync(currentUser.data.timeZone, browserTimeZone)) {
      return;
    }

    attempted.current = true;
    mutation.mutate(browserTimeZone);
  }, [currentUser.data]);

  return null;
}

/**
 * Монтирует синхронизацию пояса только для вошедших.
 * @returns {import('react').ReactNode} Компонент синхронизации.
 */
export function TimeZoneSync() {
  const status = useAuthStore((state) => state.status);

  return status === "authenticated" ? <SyncForSignedInUser /> : null;
}
