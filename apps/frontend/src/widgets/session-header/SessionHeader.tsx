"use client";

// Слой widgets: верхняя панель "Открытой сессии" - бренд, короткий id, ссылка-приглашение,
// переключение редактора
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { ToggleEditorButton } from "@/features/toggle-editor";
import { formatSessionNumber, sessionApi } from "@/entities/session";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

const COPY_CONFIRMATION_MS = 2000;

/**
 * Пропсы {@link SessionHeader}.
 */
export interface SessionHeaderProps {
  /**
   * ID отображаемой сессии, нужен для ссылки на экран фидбека.
   */
  sessionId: string;

  /**
   * Владеет ли пользователь сессией: владелец завершает её для всех, остальные просто выходят.
   */
  isOwner: boolean;

  /**
   * Интервьюер
   */
  isInterviewer: boolean;

  /**
   * Редактор открыт/закрыт
   */
  editorOpen: boolean;
}

/**
 * Верхняя панель экрана "Открытая сессия": логотип, короткий id сессии, кнопка копирования
 * ссылки-приглашения и действие "Завершить" (владелец) или "Выйти" (остальные).
 * Оба ведут на экран фидбека; уход со страницы размонтирует LiveKit-комнату и отключает от неё.
 * @param {SessionHeaderProps} props - Пропсы шапки.
 * @returns {import('react').ReactNode} Шапка сессии.
 */
export function SessionHeader(props: SessionHeaderProps) {
  const { sessionId, isOwner, isInterviewer, editorOpen } = props;
  const router = useRouter();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const t = useTranslations("session");
  const feedbackHref = `/sessions/${sessionId}/feedback`;

  /**
   * Завершает сессию для всех участников.
   * @returns {Promise<void>} Завершается, когда сессия переведена в COMPLETED.
   */
  function endSession(): Promise<void> {
    return sessionApi.end(sessionId);
  }

  /**
   * Переходит на экран фидбека после завершения сессии.
   * @returns {void}
   */
  function handleEndSuccess(): void {
    router.push(getLocalizedHref(feedbackHref, locale));
  }

  const endMutation = useMutation({ mutationFn: endSession, onSuccess: handleEndSuccess });
  // После успеха кнопка остаётся занятой, пока идёт переход на экран фидбека
  const isEnding = endMutation.isPending || endMutation.isSuccess;

  /**
   * Копирует URL комнаты (это и есть ссылка-приглашение) и ненадолго показывает подтверждение.
   * @returns {Promise<void>} Завершается, когда попытка копирования закончена.
   */
  async function copyInviteLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    } catch {
      // Буфер обмена недоступен (например, нет разрешения)
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-3">
        <LocalizedLink href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            I
          </span>
          Interviewly
        </LocalizedLink>
        <span className="text-sm text-muted-foreground">
          {t("sessionLabel")} <span className="font-mono">#{formatSessionNumber(sessionId)}</span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={copyInviteLink}>
          {copied ? t("inviteLinkCopied") : t("copyInviteLink")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {isInterviewer && <ToggleEditorButton sessionId={sessionId} editorOpen={editorOpen} />}
        {endMutation.isError && <span className="text-sm text-destructive">{t("endSessionError")}</span>}
        {isOwner
          ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              isLoading={isEnding}
              onClick={() => endMutation.mutate()}
            >
              {isEnding
                ? t("endingSession")
                : t("endSession")}
            </Button>
          )
          : (
            <Button asChild variant="outline">
              <LocalizedLink href={feedbackHref}>{t("leaveSession")}</LocalizedLink>
            </Button>
          )}
      </div>
    </header>
  );
}
