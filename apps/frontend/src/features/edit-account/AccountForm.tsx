"use client";

// Слой features: блок «Аккаунт» личного кабинета - имя, фамилия, Telegram-ник и email.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubmitEvent } from "react";

import { getHttpMessage } from "@/shared/api/http-client";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUser,
  userApi,
  type CurrentUser,
  type UpdateMeInput,
} from "@/entities/user";

const NAME_MAX_LENGTH = 255;
const TELEGRAM_USERNAME_MAX_LENGTH = 33;

/**
 * Ник в Telegram отклонен.
 * @param {unknown} error - Ошибка сохранения.
 * @returns {boolean} `true`, если причина в формате.
 */
function isTelegramUsernameError(error: unknown): boolean {
  return getHttpMessage(error).includes("telegramUsername");
}

/**
 * Форма имени, фамилии и Telegram-ника.
 * @returns {import('react').ReactNode} Карточка «Аккаунт».
 */
export function AccountForm() {
  const t = useTranslations("account");
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  const saveMutation = useMutation({
    mutationFn: userApi.updateMe,
    /**
     * Кэширует сохранённого пользователя, остальные экраны видят новые значения.
     * @param {CurrentUser} saved - Пользователь после сохранения.
     * @returns {void}
     */
    onSuccess: (saved) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, saved);
    },
  });

  if (!currentUser.data) {
    return null;
  }

  const user = currentUser.data;

  /**
   * Читает поля формы и отправляет их на сервер.
   * @param {SubmitEvent<HTMLFormElement>} event - Событие отправки формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<keyof UpdateMeInput, string>;

    saveMutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName,
      telegramUsername: values.telegramUsername,
    });
  }

  return (
    <Card className="p-8">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-first-name">{t("firstName")}</Label>
            <Input
              id="account-first-name"
              name="firstName"
              defaultValue={user.firstName}
              maxLength={NAME_MAX_LENGTH}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-last-name">{t("lastName")}</Label>
            <Input id="account-last-name" name="lastName" defaultValue={user.lastName ?? ""} maxLength={NAME_MAX_LENGTH} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-telegram">{t("telegramUsername")}</Label>
          <Input
            id="account-telegram"
            name="telegramUsername"
            defaultValue={user.telegramUsername ?? ""}
            placeholder={t.raw("telegramPlaceholder")}
            maxLength={TELEGRAM_USERNAME_MAX_LENGTH}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">{t("telegramHint")}</p>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-destructive">
            {isTelegramUsernameError(saveMutation.error) ? t("saveErrorTelegram") : t("saveError")}
          </p>
        )}
        {saveMutation.isSuccess && <p className="text-sm text-muted-foreground">{t("saved")}</p>}

        <Button type="submit" isLoading={saveMutation.isPending}>
          {saveMutation.isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </Card>
  );
}
