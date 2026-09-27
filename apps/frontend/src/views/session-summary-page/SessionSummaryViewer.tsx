"use client";

// Слой views: клиентская граница экрана интервью. Роль, партнёр и метрики зависят от того, кто
// смотрит, а это фронт знает только из access-токена в памяти браузера. Не-участнику сессия
// не показывается. Секции, не зависящие от смотрящего, приходят готовыми как children.
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { SessionFeedbackPanel } from "@/widgets/session-feedback-panel";
import { SessionSummaryOverview } from "@/widgets/session-summary-overview";
import { getSessionDetailsFor, type PastSession } from "@/entities/session";
import { useRequiredUserEmail } from "@/shared/api/use-required-user-email";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

/**
 * Пропсы {@link SessionSummaryViewer}.
 */
export interface SessionSummaryViewerProps {
  /**
   * Прошедшее интервью для отображения.
   */
  session: PastSession;

  /**
   * Секции, не зависящие от того, кто смотрит, рендерятся после отзыва пользователя.
   */
  children: ReactNode;
}

/**
 * Содержимое экрана прошедшего интервью с точки зрения текущего пользователя: шапка, его
 * отзыв и переданные секции - либо сообщение "не найдено", если он не участвовал в сессии.
 * Пока не известно, кто смотрит, показывает заглушку загрузки (гостей отправляет на "/auth").
 * @param {SessionSummaryViewerProps} props - пропсы вьюера.
 * @returns {import('react').ReactNode} Содержимое интервью, сообщение или заглушка.
 */
export function SessionSummaryViewer(props: SessionSummaryViewerProps) {
  const { session, children } = props;
  const email = useRequiredUserEmail();
  const common = useTranslations("common");
  const t = useTranslations("summary");
  const interview = useTranslations("interview");

  if (!email) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  const details = getSessionDetailsFor(session, email);

  if (!details) {
    return (
      <div>
        <p className="text-2xl font-bold">{interview("sessionNotFound")}</p>
        <Button asChild variant="outline" size="sm" className="mt-6">
          <LocalizedLink href="/sessions">
            <ArrowLeft className="h-4 w-4" />
            {t("backToHistory")}
          </LocalizedLink>
        </Button>
      </div>
    );
  }

  return (
    <>
      <SessionSummaryOverview details={details} />

      <div className="mt-4 space-y-4">
        <SessionFeedbackPanel sessionId={details.id} />
        {children}
      </div>
    </>
  );
}
