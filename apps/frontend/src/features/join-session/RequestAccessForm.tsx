"use client";

// Слой features: вход в чужую сессию по ссылке - заявка владельцу,
// ожидание одобрения и отказ. Статус заявки опрашивает страница комнаты через GET /sessions/:id/me
import { useState, type SubmitEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getHttpStatus } from "@/shared/api/http-client";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { sessionApi, type MySessionState } from "@/entities/session";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

/**
 * Пропсы {@link RequestAccessForm}.
 */
export interface RequestAccessFormProps {
  /**
   * Сессия, в которую хочет войти пользователь
   */
  sessionId: string;

  /**
   * Текущее состояние пользователя в сессии
   */
  state: MySessionState;
}

/**
 * Выбирает текст ошибки для неудавшейся заявки
 * @param {unknown} error
 * @returns {"wrongPassword" | "inviteOnly" | "requestError"} ключ перевода
 */
function getRequestErrorKey(error: unknown): "wrongPassword" | "inviteOnly" | "requestError" {
  const status = getHttpStatus(error);
  if (status === HTTP_UNAUTHORIZED) {
    return "wrongPassword";
  }

  return status === HTTP_FORBIDDEN ? "inviteOnly" : "requestError";
}

/**
 * Экран для неучастника, открывшего ссылку на сессию: отправляет заявку владельцу, затем
 * показывает ожидание одобрения (или отказ)
 * @param {RequestAccessFormProps} props
 * @returns {import('react').ReactNode} Карточка заявки на вход
 */
export function RequestAccessForm(props: RequestAccessFormProps) {
  const { sessionId, state } = props;
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const t = useTranslations("interview");
  const needsPassword = state.access === "PASSWORD";

  /**
   * Отправляет заявку на вход в эту сессию
   * @returns {Promise<void>} Завершается, когда заявка сохранена
   */
  function sendRequest() {
    return sessionApi.requestAccess(sessionId, needsPassword ? password : undefined);
  }

  /**
   * Обновляет состояние пользователя, чтобы страница перешла в состояние "ожидание"
   * @returns {Promise<void>} Завершается, когда состояние перезапрошено
   */
  function refreshMyState() {
    return queryClient.invalidateQueries({ queryKey: ["sessions", sessionId, "me"] });
  }

  const requestMutation = useMutation({ mutationFn: sendRequest, onSuccess: refreshMyState });

  /**
   * Отправляет заявку
   * @param {SubmitEvent<HTMLFormElement>} event
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    requestMutation.mutate();
  }

  if (state.access === "INVITE") {
    return <p className="text-muted-foreground">{t("inviteOnly")}</p>;
  }

  if (state.accessRequestStatus === "PENDING") {
    return <p className="text-muted-foreground">{t("waitingForApproval")}</p>;
  }

  return (
    <Card className="w-full max-w-md p-8 text-left">
      <h1 className="text-2xl font-bold tracking-tight">{t("requestAccessTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("requestAccessDescription")}</p>

      {state.accessRequestStatus === "REJECTED" && (
        <p className="mt-4 text-sm text-destructive">{t("requestRejected")}</p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {needsPassword && (
          <div className="space-y-2">
            <Label htmlFor="session-password">{t("passwordLabel")}</Label>
            <Input
              id="session-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={requestMutation.isPending}>
          {requestMutation.isPending ? t("sendingRequest") : t("requestAccess")}
        </Button>

        {requestMutation.isError && (
          <p className="text-sm text-destructive">{t(getRequestErrorKey(requestMutation.error))}</p>
        )}
      </form>
    </Card>
  );
}
