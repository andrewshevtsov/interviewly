"use client";

// Слой features: блок «Email» личного кабинета - текущий адрес, смена с подтверждением по письму.
// Пароль запрашивается только у кого он есть.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";

import { formatDateTime } from "@/shared/lib/format-date-time";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  classifyEmailChangeError,
  EMAIL_CHANGE_QUERY_KEY,
  isPlaceholderEmail,
  useCurrentUser,
  userApi,
  type PendingEmailChange,
} from "@/entities/user";

const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MAX_LENGTH = 72;

/**
 * Карточка смены email: показывает адрес и форму нового адреса.
 * @returns {import('react').ReactNode} Карточка.
 */
export function ChangeEmail() {
  const t = useTranslations("account");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  const pending = useQuery({ queryKey: EMAIL_CHANGE_QUERY_KEY, queryFn: userApi.getPendingEmailChange });

  const requestMutation = useMutation({
    mutationFn: userApi.requestEmailChange,
    /**
     * Ожидание смены email.
     * @param {PendingEmailChange} saved - Запрос, ожидающий подтверждения.
     * @returns {void}
     */
    onSuccess: (saved) => {
      queryClient.setQueryData(EMAIL_CHANGE_QUERY_KEY, saved);
      setIsEditing(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: userApi.cancelEmailChange,
    /**
     * Убирает ожидание смены из кеша.
     * @returns {void}
     */
    onSuccess: () => {
      queryClient.setQueryData(EMAIL_CHANGE_QUERY_KEY, null);
    },
  });

  if (!currentUser.data) {
    return null;
  }

  const user = currentUser.data;
  const hasRealEmail = !isPlaceholderEmail(user.email);

  /**
   * Отправляет новый адрес (и пароль, если есть) на сервер.
   * @param {SubmitEvent<HTMLFormElement>} event - Событие отправки формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");

    requestMutation.mutate({
      email: String(formData.get("email")).trim(),
      password: user.hasPassword && typeof password === "string" ? password : undefined,
    });
  }

  /**
   * Прячет форму и сбрасывает ошибку прошлой попытки.
   * @returns {void}
   */
  function closeForm(): void {
    requestMutation.reset();
    setIsEditing(false);
  }

  return (
    <Card className="p-8">
      <h2 className="text-lg font-semibold">{t("emailTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("emailDescription")}</p>

      <div className="mt-6 space-y-2">
        <Label htmlFor="account-email">{t("emailCurrent")}</Label>
        <Input id="account-email" value={hasRealEmail ? user.email : t("emailNone")} readOnly disabled />
        {!hasRealEmail && <p className="text-xs text-muted-foreground">{t("emailNoneHint")}</p>}
      </div>

      {pending.data && (
        <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{t("pendingTitle")}</p>
          <p className="mt-2 text-sm">
            {t("pendingPrefix")} <strong>{pending.data.newEmail}</strong>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("pendingUntil")} {formatDateTime(pending.data.expiresAt, locale)}. {t("pendingHint")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            isLoading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {t("cancelChange")}
          </Button>
        </div>
      )}

      {isEditing
        ? (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="account-new-email">{t("newEmail")}</Label>
              <Input
                id="account-new-email"
                name="email"
                type="email"
                placeholder={t.raw("newEmailPlaceholder")}
                maxLength={EMAIL_MAX_LENGTH}
                autoComplete="off"
                required
              />
            </div>

        {user.hasPassword && (
          <div className="space-y-2">
            <Label htmlFor="account-password">{t("currentPassword")}</Label>
            <Input
              id="account-password"
              name="password"
              type="password"
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="current-password"
              required
            />
          </div>
        )}

        {requestMutation.isError && (
          <p className="text-sm text-destructive">{t(classifyEmailChangeError(requestMutation.error))}</p>
        )}

            <div className="flex gap-3">
              <Button type="submit" isLoading={requestMutation.isPending}>
                {requestMutation.isPending ? t("sendingConfirmation") : t("sendConfirmation")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                {t("closeForm")}
              </Button>
            </div>
          </form>
        )
        : (
          <Button type="button" variant="outline" className="mt-6" onClick={() => setIsEditing(true)}>
            {hasRealEmail ? t("changeEmail") : t("addEmail")}
          </Button>
        )}
    </Card>
  );
}
