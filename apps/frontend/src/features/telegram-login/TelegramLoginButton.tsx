"use client";

// Слой features: кнопка "войти через Telegram" - встраивает официальный Telegram Login
// Widget (https://core.telegram.org/widgets/login) и логинится через POST /auth/telegram
// данными, которые он возвращает в data-onauth callback.
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi, type TelegramAuthPayload } from "@/shared/api/auth-api";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";

const TELEGRAM_WIDGET_SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";
// Уникальное имя, чтобы не столкнуться с другим кодом на странице - виджет вызывает
// именно этот global по имени из атрибута data-onauth, само имя ему не передаётся.
const TELEGRAM_AUTH_CALLBACK_NAME = "onInterviewlyTelegramAuth";

declare global {
  /**
   * Extends `Window` with the global callback the Telegram Login Widget script calls by name
   * (set via `data-onauth`) once the user confirms the login in their Telegram client.
   */
  interface Window {
    /**
     * Receives the signed login data from the Telegram Login Widget.
     */
    [TELEGRAM_AUTH_CALLBACK_NAME]?: (user: TelegramAuthPayload) => void;
  }
}

/**
 * "Войти через Telegram": рендерит официальный Telegram Login Widget и логинится через
 * `/auth/telegram` данными, которые виджет присылает в свой callback. Ничего не рендерит,
 * если `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` не задан (например, локальная разработка без
 * своего dev-бота) - руками эндпоинт всё равно можно проверить, см.
 * docs/dev/telegram-auth-manual-testing.md.
 * @returns {import('react').ReactNode} Контейнер виджета, или `null`.
 */
export function TelegramLoginButton() {
  const router = useRouter();
  const locale = useLocale();
  const auth = useTranslations("auth");
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const telegramLoginMutation = useMutation({
    mutationFn: authApi.telegramLogin,
    /**
     * Stores the new access token and redirects to the profile page.
     * @param {{ accessToken: string }} tokens - The login response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAuthenticated(tokens.accessToken);
      router.push(getLocalizedHref("/profile", locale));
    },
  });

  useEffect(() => {
    if (!botUsername || !containerRef.current) {
      return;
    }

    /**
     * Logs in via `/auth/telegram` with the data the widget just confirmed.
     * @param {TelegramAuthPayload} user - Signed login data from the widget.
     * @returns {void}
     */
    window[TELEGRAM_AUTH_CALLBACK_NAME] = (user) => telegramLoginMutation.mutate(user);

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", `${TELEGRAM_AUTH_CALLBACK_NAME}(user)`);
    // Запрашивает разрешение писать пользователю - нужно боту, чтобы присылать
    // уведомления о матчах/сессиях из витрины участников (см. widgets/telegram-notice).
    script.setAttribute("data-request-access", "write");
    containerRef.current.appendChild(script);

    return () => {
      delete window[TELEGRAM_AUTH_CALLBACK_NAME];
    };
  }, [botUsername]);

  if (!botUsername) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">{auth("continueWithTelegram")}</p>
      <div ref={containerRef} />
      {telegramLoginMutation.isError && (
        <p className="text-sm text-destructive">{auth("telegramLoginError")}</p>
      )}
    </div>
  );
}
