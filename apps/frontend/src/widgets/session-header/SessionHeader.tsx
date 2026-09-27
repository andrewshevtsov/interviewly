"use client";

// Слой widgets: верхняя панель "Открытой сессии" - бренд, короткий id, ссылка-приглашение, таймер
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { formatSessionNumber, sessionApi } from "@/entities/session";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

const TIMER_TICK_MS = 1000;
const SECONDS_PER_TICK = 1;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const TIME_UNIT_DIGITS = 2;
const COPY_CONFIRMATION_MS = 2000;

/**
 * Форматирует длительность в секундах как "ЧЧ:ММ:СС".
 * @param {number} totalSeconds - Прошедшее время в секундах.
 * @returns {string} Отформатированная длительность.
 */
function formatElapsed(totalSeconds: number): string {
  const secondsPerHour = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const hours = Math.floor(totalSeconds / secondsPerHour);
  const minutes = Math.floor((totalSeconds % secondsPerHour) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(TIME_UNIT_DIGITS, "0"))
    .join(":");
}

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
}

/**
 * Верхняя панель экрана "Открытая сессия": логотип, короткий id сессии, кнопка копирования
 * ссылки-приглашения, таймер записи и действие "Завершить" (владелец) или "Выйти" (остальные).
 * Оба ведут на экран фидбека; уход со страницы размонтирует LiveKit-комнату и отключает от неё.
 * @param {SessionHeaderProps} props - Пропсы шапки.
 * @returns {import('react').ReactNode} Шапка сессии.
 */
export function SessionHeader(props: SessionHeaderProps) {
  const { sessionId, isOwner } = props;
  const router = useRouter();
  const locale = useLocale();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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

  useEffect(() => {
    const timer = setInterval(
      () => setElapsedSeconds((seconds) => seconds + SECONDS_PER_TICK),
      TIMER_TICK_MS,
    );

    return () => clearInterval(timer);
  }, []);

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
        <span className="flex items-center gap-2 font-mono text-sm text-destructive">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          {t("recording")} {formatElapsed(elapsedSeconds)}
        </span>
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
