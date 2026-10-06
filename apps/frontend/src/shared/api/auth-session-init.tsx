"use client";

// Слой shared: на первом монтировании тихо пытается восстановить сессию из
// httpOnly-куки с refresh-токеном (например, после перезагрузки страницы),
// чтобы auth-store перешёл из `initializing` в итоговое состояние сессии.
import { useEffect } from "react";

import { useAuthStore } from "@/shared/model/auth-store";

import { getHttpStatus, refreshAccessToken } from "./http-client";

const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000;
const REFRESH_RETRY_MS = 10_000;
const HTTP_UNAUTHORIZED = 401;

/** Если первый refresh не ответил за это время, считаем пользователя гостем. */
const SESSION_RESTORE_TIMEOUT_MS = 5_000;

/**
 * Читает время истечения JWT без проверки подписи: подпись всё равно проверяет backend,
 * а frontend использует значение только для планирования обновления.
 * @param {string} accessToken - Выданный backend токен доступа.
 * @returns {number | null} Время истечения в миллисекундах либо null для некорректного JWT.
 */
function getAccessTokenExpiration(accessToken: string): number | null {
  try {
    const payloadSegment = accessToken.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const base64 = payloadSegment.replaceAll("-", "+").replaceAll("_", "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(paddedBase64)) as {
      exp?: number;
    };

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Восстанавливает браузерную сессию при загрузке, заранее обновляет токен доступа
 * и повторяет обновление после сна компьютера или возвращения сети.
 * @returns {null} Компонент управляет только сессией и ничего не отображает.
 */
export function AuthSessionInit(): null {
  const setAnonymous = useAuthStore((state) => state.setAnonymous);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const restoreTimeoutId = window.setTimeout(() => {
      if (!cancelled && useAuthStore.getState().status === "initializing") {
        setAnonymous();
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    /**
     * Планирует обновление немного раньше истечения текущего токена доступа.
     * @param {string | null} accessToken - Текущий токен из общего состояния авторизации.
     * @returns {void}
     */
    function scheduleRefresh(accessToken: string | null): void {
      clearTimeout(refreshTimer);
      if (!accessToken) {
        return;
      }

      const expiresAt = getAccessTokenExpiration(accessToken);
      if (!expiresAt) {
        return;
      }

      const delay = Math.max(0, expiresAt - Date.now() - ACCESS_TOKEN_REFRESH_MARGIN_MS);
      refreshTimer = setTimeout(refreshSession, delay);
    }

    /**
     * Обновляет браузерную сессию; все потребители получают новый токен через Zustand.
     * @returns {void}
     */
    function refreshSession(): void {
      void refreshAccessToken().catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        if (getHttpStatus(error) === HTTP_UNAUTHORIZED) {
          // Refresh-cookie отсутствует или истёк: нужна повторная авторизация.
          setAnonymous();
          return;
        }

        // Кратковременный сетевой сбой не должен завершать браузерную сессию.
        refreshTimer = setTimeout(refreshSession, REFRESH_RETRY_MS);
      });
    }

    /**
     * После сна или возвращения сети сразу восстанавливает браузерную сессию.
     * @returns {void}
     */
    function handleResume(): void {
      if (document.visibilityState === "visible" && navigator.onLine) {
        refreshSession();
      }
    }

    const unsubscribe = useAuthStore.subscribe((state) => scheduleRefresh(state.accessToken));
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("online", handleResume);
    refreshSession();

    return () => {
      cancelled = true;
      window.clearTimeout(restoreTimeoutId);
      clearTimeout(refreshTimer);
      unsubscribe();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("online", handleResume);
    };
  }, [setAnonymous]);

  return null;
}
