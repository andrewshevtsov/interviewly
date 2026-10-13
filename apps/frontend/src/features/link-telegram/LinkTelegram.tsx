"use client";

// Слой features: привязка и отвязка Telegram в личном кабинете.
// Уведомления идут в привязанный Telegram, иначе на почту.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/shared/api/auth-api";
import { getHttpStatus } from "@/shared/api/http-client";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { TelegramWidget } from "@/shared/ui/telegram-widget";
import { CURRENT_USER_QUERY_KEY, useCurrentUser, userApi } from "@/entities/user";

const HTTP_CONFLICT = 409;

/**
 * Виджет привязки или кнопка отвязки.
 * @returns {import('react').ReactNode} Блок управления Telegram.
 */
export function LinkTelegram() {
  const t = useTranslations("notification");
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  /**
   * Перечитывает пользователя после привязки/отвязки.
   * @returns {Promise<void>} Завершается после инвалидации кеша.
   */
  const refreshUser = () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });

  const linkMutation = useMutation({ mutationFn: authApi.linkTelegram, onSuccess: refreshUser });
  const unlinkMutation = useMutation({ mutationFn: userApi.unlinkTelegram, onSuccess: refreshUser });

  const user = currentUser.data;
  if (!user) {
    return null;
  }

  const username = user.telegramUsername && `@${user.telegramUsername}`;
  const error = linkMutation.error ?? unlinkMutation.error;
  const conflictKey = unlinkMutation.error ? "errNeedEmail" : "errTaken";
  const errorKey = getHttpStatus(error) === HTTP_CONFLICT ? conflictKey : "errGeneric";

  return (
    <div className="mt-4 space-y-3">
      {user.telegramId && (
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
      )}
      {!user.telegramId && botUsername && <TelegramWidget botUsername={botUsername} onAuth={linkMutation.mutate} />}
      {error && (
        <p className="text-sm text-destructive">{t(errorKey)}</p>
      )}
    </div>
  );
}
