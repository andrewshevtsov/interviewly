"use client";

// Слой features: форма создания сессии - название, условие задачи и приватность.
// Язык редактора здесь не выбирается: его задаёт задача, а позже сам редактор в комнате.
// Отправляет реальный POST /sessions.
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { sessionApi, type ApiSession, type NewSessionDraft } from "@/entities/session";

// Совпадают с ограничениями CreateSessionDto на бэкенде.
const MIN_PASSWORD_LENGTH = 4;
const MAX_TITLE_LENGTH = 120;
const MAX_TASK_LENGTH = 4000;

/**
 * Пропсы {@link CreateSessionForm}.
 */
export interface CreateSessionFormProps {
  /**
   * Начальные значения черновика для заполнения формы.
   */
  draft: NewSessionDraft;
}

/**
 * Форма создания сессии: название, условие задачи и переключатель приватности с паролем.
 * Запуск создаёт сессию на бэкенде и открывает её комнату.
 * @param {CreateSessionFormProps} props - Пропсы формы.
 * @returns {import('react').ReactNode} Форма создания сессии.
 */
export function CreateSessionForm(props: CreateSessionFormProps) {
  const { draft } = props;
  const router = useRouter();
  const locale = useLocale();
  const [isPrivate, setIsPrivate] = useState(draft.isPrivate);
  const [password, setPassword] = useState(draft.accessCode);
  const t = useTranslations("newSession");

  /**
   * Открывает комнату только что созданной сессии.
   * @param {ApiSession} session - Созданная сессия.
   * @returns {void}
   */
  function openCreatedSession(session: ApiSession): void {
    router.push(getLocalizedHref(`/sessions/${session.id}`, locale));
  }

  const createMutation = useMutation({ mutationFn: sessionApi.create, onSuccess: openCreatedSession });
  const isPasswordTooShort = isPrivate && password.length < MIN_PASSWORD_LENGTH;

  /**
   * Создаёт сессию: закрытую паролем, если отмечена приватность, иначе открытую для заявок.
   * @param {SubmitEvent<HTMLFormElement>} event - Событие отправки формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isPasswordTooShort) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const { title, task } = Object.fromEntries(formData) as Record<"title" | "task", string>;
    const access = isPrivate ? { access: "PASSWORD" as const, password } : { access: "OPEN" as const };
    createMutation.mutate({ title, task, ...access });
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="session-title">{t("sessionTitleLabel")}</Label>
          <Input
            id="session-title"
            name="title"
            defaultValue={draft.title}
            placeholder={t("sessionTitlePlaceholder")}
            maxLength={MAX_TITLE_LENGTH}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-task">{t("taskLabel")}</Label>
          <Textarea
            id="session-task"
            name="task"
            defaultValue={draft.task}
            rows={4}
            placeholder={t("taskPlaceholder")}
            maxLength={MAX_TASK_LENGTH}
          />
          <p className="text-xs text-muted-foreground">{t("taskHint")}</p>
        </div>

        <Card className="bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{t("privateSession")}</p>
              <p className="text-sm text-muted-foreground">{t("privateSessionHint")}</p>
            </div>
            <Checkbox
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              aria-label={t("privateSession")}
            />
          </div>

          {isPrivate && (
            <>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label={t("privateSession")}
                className="mt-4 font-mono"
              />
              {isPasswordTooShort && <p className="mt-2 text-sm text-destructive">{t("passwordTooShort")}</p>}
            </>
          )}
        </Card>

        <p className="text-sm text-muted-foreground">{t("telegramNotice")}</p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createMutation.isPending}
          disabled={isPasswordTooShort}
        >
          {createMutation.isPending ? t("launchingSession") : t("launchSession")}
        </Button>

        {createMutation.isError && <p className="text-sm text-destructive">{t("createError")}</p>}
      </form>
    </Card>
  );
}
