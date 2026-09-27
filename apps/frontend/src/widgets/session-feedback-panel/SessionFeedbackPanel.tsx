"use client";

// Слой widgets: блок "Ваш отзыв о партнёре" на экране прошедшего интервью. Отзыв
// запрашивается у бэка на клиенте (access-токен живёт только в памяти браузера)
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useLocale, useTranslations } from "@/shared/i18n-context";
import { formatDate } from "@/shared/lib/format-date";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { SectionLabel } from "@/shared/ui/section-label";
import { MAX_SESSION_SCORE } from "@/shared/config/constants";
import { feedbackApi } from "@/entities/feedback";

/**
 * Пропсы {@link SessionFeedbackPanel}.
 */
export interface SessionFeedbackPanelProps {
  /**
   * Сессия, отзыв о которой нужно показать.
   */
  sessionId: string;
}

/**
 * Отзыв текущего пользователя о партнёре в данной сессии - либо подсказка и кнопка
 * "оставить отзыв", если он его ещё не написал.
 * @param {SessionFeedbackPanelProps} props - пропсы блока.
 * @returns {import('react').ReactNode} Блок отзыва.
 */
export function SessionFeedbackPanel(props: SessionFeedbackPanelProps) {
  const { sessionId } = props;
  const locale = useLocale();
  const t = useTranslations("summary");
  const feedbackT = useTranslations("feedback");
  const session = useTranslations("session");
  const common = useTranslations("common");

  const feedbackQuery = useQuery({
    queryKey: ["feedback", "me"],
    queryFn: feedbackApi.myFeedbackHistory,
    retry: false,
  });
  const feedback = feedbackQuery.data?.find((entry) => entry.sessionId === sessionId);

  let body: ReactNode;
  if (feedbackQuery.isPending) {
    body = <p className="mt-3 text-sm text-muted-foreground">{common("loading")}</p>;
  } else if (feedbackQuery.isError) {
    body = <p className="mt-3 text-sm text-destructive">{t("feedbackLoadError")}</p>;
  } else if (feedback) {
    body = (
      <div className="mt-3 flex items-start gap-4">
        <div className="flex-1">
          <p className="font-semibold">{feedback.targetUser.name}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {feedback.comment || feedbackT("noComment")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("feedbackWritten")} {formatDate(feedback.createdAt, locale)} · {t("feedbackPrivate")}
          </p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{feedback.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {session("scoreOutOf")} {MAX_SESSION_SCORE}
          </p>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("feedbackEmpty")}</p>
        <Button asChild>
          <LocalizedLink href={`/sessions/${sessionId}/feedback`}>{t("leaveFeedback")}</LocalizedLink>
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-5">
      <SectionLabel>{t("feedbackTitle")}</SectionLabel>
      {body}
    </Card>
  );
}
