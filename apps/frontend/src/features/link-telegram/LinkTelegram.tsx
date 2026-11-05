"use client";

// Слой features: привязка и отвязка Telegram в личном кабинете.
// Уведомления идут в привязанный Telegram, иначе на почту.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/shared/api/auth-api";
import { getHttpStatus } from "@/shared/api/http-client";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { useTelegramFlowResult, type TelegramErrorCode } from "@/shared/lib/use-telegram-flow-result";
import { Button } from "@/shared/ui/button";
import { CURRENT_USER_QUERY_KEY, useCurrentUser, userApi } from "@/entities/user";

const HTTP_CONFLICT = 409;
const PROFILE_PATH = "/profile";

const ERROR_MESSAGE_KEYS = {
  denied: "errDenied",
  taken: "errTaken",
  failed: "errGeneric",
  unavailable: "errUnavailable",
} as const satisfies Record<TelegramErrorCode, string>;

/**
 * Кнопка привязки (переход на Telegram) или отвязки.
 * @returns {import('react').ReactNode} Блок управления Telegram.
 */
export function LinkTelegram() {
  const t = useTranslations("notification");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const flow = useTelegramFlowResult();

  /**
   * Запрашивает у backend адрес Telegram для привязки с возвратом в профиль.
   * @returns {Promise<string>} Адрес авторизации в Telegram.
   */
  const startLink = () => authApi.startTelegramLink(getLocalizedHref(PROFILE_PATH, locale));

  const linkMutation = useMutation({
    mutationFn: startLink,
    /**
     * Уходит на Telegram всей страницей: подтверждение происходит там, а не в попапе.
     * @param {string} url - Адрес авторизации в Telegram.
     * @returns {void}
     */
    onSuccess: (url) => window.location.assign(url),
  });
  const unlinkMutation = useMutation({
    mutationFn: userApi.unlinkTelegram,
    /**
     * Перечитывает пользователя после отвязки.
     * @returns {Promise<void>} Завершается после инвалидации кеша.
     */
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
  });

  const user = currentUser.data;
  if (!user) {
    return null;
  }

  const username = user.telegramUsername && `@${user.telegramUsername}`;
  const actionError = linkMutation.error ?? unlinkMutation.error;
  const actionErrorKey = getHttpStatus(actionError) === HTTP_CONFLICT ? "errNeedEmail" : "errGeneric";
  const flowErrorKey = flow.error && ERROR_MESSAGE_KEYS[flow.error];
  const errorKey = actionError ? actionErrorKey : flowErrorKey;

  return (
    <div className="mt-4 space-y-3">
      {user.telegramId
        ? (
          <>
            <p className="text-sm">
              {t("linked")}
              {username && <span className="ml-1 font-medium">{username}</span>}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={unlinkMutation.isPending}
              onClick={() => unlinkMutation.mutate()}
            >
              {t("unlink")}
            </Button>
          </>
        )
        : (
          <Button variant="outline" size="sm" isLoading={linkMutation.isPending} onClick={() => linkMutation.mutate()}>
            {t("link")}
          </Button>
        )}
      {errorKey && <p className="text-sm text-destructive">{t(errorKey)}</p>}
    </div>
  );
}
