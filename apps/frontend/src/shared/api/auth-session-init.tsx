"use client";

// Слой shared: на первом монтировании тихо пытается восстановить сессию из
// httpOnly-куки с refresh-токеном (например, после перезагрузки страницы),
// чтобы auth-store перешёл из `initializing` в итоговое состояние сессии.
import { useEffect } from "react";

import { useAuthStore } from "@/shared/model/auth-store";

import { refreshAccessToken } from "./http-client";

/** Если refresh не ответил за это время, считаем пользователя гостем. */
const SESSION_RESTORE_TIMEOUT_MS = 5_000;

/**
 * Attempts a silent session restore once per app load. Renders nothing.
 * @returns {null} Always `null`.
 */
export function AuthSessionInit(): null {
  const setAnonymous = useAuthStore((state) => state.setAnonymous);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled && useAuthStore.getState().status === "initializing") {
        setAnonymous();
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    refreshAccessToken().catch(() => {
      // Нет активной сессии (нет куки/просрочена) - ожидаемо для гостя.
      if (!cancelled) {
        setAnonymous();
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [setAnonymous]);

  return null;
}
