"use client";

// Слой features: кнопка "войти через Telegram" - встраивает официальный Telegram Login
// Widget (https://core.telegram.org/widgets/login) и логинится через POST /auth/telegram
// данными, которые он возвращает в data-onauth callback.
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/shared/api/auth-api";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { DEFAULT_AFTER_AUTH_PATH } from "@/shared/lib/return-path";
import { useAuthStore } from "@/shared/model/auth-store";
import { TelegramWidget } from "@/shared/ui/telegram-widget";

/**
 * Пропсы {@link TelegramLoginButton}
 */
export interface TelegramLoginButtonProps {
  /**
   * Куда вернуть пользователя после входа
   */
  returnPath?: string;
}

/**
 * "Войти через Telegram": рендерит официальный Telegram Login Widget и логинится через
 * `/auth/telegram` данными, которые виджет присылает в свой callback. Ничего не рендерит,
 * если `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` не задан (например, локальная разработка без
 * своего dev-бота) - руками эндпоинт всё равно можно проверить, см.
 * docs/dev/telegram-auth-manual-testing.md.
 * @param {TelegramLoginButtonProps} props - Пропсы компонента.
 * @returns {import('react').ReactNode} Контейнер виджета, или `null`.
 */
export function TelegramLoginButton(props: TelegramLoginButtonProps) {
  const { returnPath } = props;
  const router = useRouter();
  const locale = useLocale();
  const auth = useTranslations("auth");
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const telegramLoginMutation = useMutation({
    mutationFn: authApi.telegramLogin,
    /**
     * Stores the new access token and redirects back to `returnPath` or to the showcase.
     * @param {{ accessToken: string }} tokens - The login response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAuthenticated(tokens.accessToken);
      router.push(getLocalizedHref(returnPath ?? DEFAULT_AFTER_AUTH_PATH, locale));
    },
  });

  if (!botUsername) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">{auth("continueWithTelegram")}</p>
      <TelegramWidget botUsername={botUsername} onAuth={telegramLoginMutation.mutate} />
      {telegramLoginMutation.isError && (
        <p className="text-sm text-destructive">{auth("telegramLoginError")}</p>
      )}
    </div>
  );
}
