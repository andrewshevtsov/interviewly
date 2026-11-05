"use client";

// Слой features: кнопка "продолжить через Telegram". Вход идёт серверным потоком OIDC: ссылка ведёт на
// backend (`/auth/telegram/login`), тот перенаправляет на Telegram и после подтверждения возвращает
// пользователя на сайт уже с сессией (refresh-кука), либо с `?telegramError=<код>`.
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { DEFAULT_AFTER_AUTH_PATH } from "@/shared/lib/return-path";
import { useTelegramFlowResult, type TelegramErrorCode } from "@/shared/lib/use-telegram-flow-result";
import { Button } from "@/shared/ui/button";

const ERROR_MESSAGE_KEYS = {
  denied: "telegramDenied",
  taken: "telegramLoginError",
  failed: "telegramLoginError",
  unavailable: "telegramUnavailable",
} as const satisfies Record<TelegramErrorCode, string>;

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
 * "Продолжить через Telegram": ссылка на серверный вход и сообщение об ошибке прошлой попытки.
 * @param {TelegramLoginButtonProps} props - Пропсы компонента.
 * @returns {import('react').ReactNode} Кнопка и, если нужно, текст ошибки.
 */
export function TelegramLoginButton(props: TelegramLoginButtonProps) {
  const { returnPath } = props;
  const locale = useLocale();
  const auth = useTranslations("auth");
  const { error } = useTelegramFlowResult();

  const target = getLocalizedHref(returnPath ?? DEFAULT_AFTER_AUTH_PATH, locale);
  const query = new URLSearchParams({ returnPath: target });
  const href = `${process.env.NEXT_PUBLIC_API_URL}/auth/telegram/login?${query}`;

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button asChild variant="outline" className="w-full">
        <a href={href}>{auth("continueWithTelegram")}</a>
      </Button>
      {error && <p className="text-sm text-destructive">{auth(ERROR_MESSAGE_KEYS[error])}</p>}
    </div>
  );
}
