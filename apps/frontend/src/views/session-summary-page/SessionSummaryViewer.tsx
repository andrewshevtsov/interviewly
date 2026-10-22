"use client";

// Слой views: клиентская граница экрана интервью. Access-токен живёт только в памяти браузера,
// поэтому сессия, участники и роль смотрящего запрашиваются у бэкенда на клиенте
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { SessionFeedbackPanel } from "@/widgets/session-feedback-panel";
import { SessionSummaryOverview } from "@/widgets/session-summary-overview";
import { sessionApi, toCompletedSession, type PastSession } from "@/entities/session";
import { getHttpStatus } from "@/shared/api/http-client";
import { useGuestRedirect } from "@/shared/api/use-guest-redirect";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/**
 * Пропсы {@link SessionSummaryViewer}.
 */
export interface SessionSummaryViewerProps {
  /**
   * UUID прошедшего интервью.
   */
  sessionId: string;

  /**
   * Мок-интервью - источник значений для заблюренных метрик
   */
  placeholder: PastSession;

  /**
   * Секции на мок-данных, рендерятся после отзыва пользователя
   */
  children: ReactNode;
}

/**
 * Ссылка под сообщением {@link SummaryMessage}
 */
interface SummaryLink {
  /**
   * Куда ведёт ссылка
   */
  href: string;

  /**
   * Текст ссылки
   */
  label: string;
}

/**
 * Пропсы {@link SummaryMessage}.
 */
interface SummaryMessageProps {
  /**
   * Текст сообщения
   */
  text: string;

  /**
   * Ссылка под сообщением
   */
  link: SummaryLink;
}

/**
 * Сообщение вместо экрана интервью (не найдено, не завершено, ошибка) со ссылкой
 * @param {SummaryMessageProps} props - текст и ссылка
 * @returns {ReactNode} Сообщение
 */
function SummaryMessage(props: SummaryMessageProps) {
  const { text, link } = props;

  return (
    <div>
      <p className="text-2xl font-bold">{text}</p>
      <Button asChild variant="outline" size="sm" className="mt-6">
        <LocalizedLink href={link.href}>
          <ArrowLeft className="h-4 w-4" />
          {link.label}
        </LocalizedLink>
      </Button>
    </div>
  );
}

/**
 * Содержимое экрана прошедшего интервью с точки зрения текущего пользователя: шапка, его
 * отзыв и переданные секции. Для чужой или незавершённой сессии - сообщение; гостя
 * отправляет на "/auth".
 * @param {SessionSummaryViewerProps} props - пропсы вьюера.
 * @returns {ReactNode} Содержимое интервью, сообщение или заглушка загрузки.
 */
export function SessionSummaryViewer(props: SessionSummaryViewerProps) {
  const { sessionId, placeholder, children } = props;
  const common = useTranslations("common");
  const t = useTranslations("summary");
  const interview = useTranslations("interview");
  const session = useTranslations("session");
  useGuestRedirect();

  /**
   * Загружает карточку сессии
   * @returns {ReturnType<typeof sessionApi.get>} Сессия
   */
  function getSession() {
    return sessionApi.get(sessionId);
  }

  /**
   * Загружает роль текущего пользователя в сессии
   * @returns {ReturnType<typeof sessionApi.getMyState>} Состояние пользователя
   */
  function getMyState() {
    return sessionApi.getMyState(sessionId);
  }

  /**
   * Загружает участников сессии
   * @returns {ReturnType<typeof sessionApi.listParticipants>} Участники
   */
  function listParticipants() {
    return sessionApi.listParticipants(sessionId);
  }

  const sessionQuery = useQuery({ queryKey: ["sessions", sessionId], queryFn: getSession, retry: false });
  const stateQuery = useQuery({ queryKey: ["sessions", sessionId, "me"], queryFn: getMyState, retry: false });
  const isCompleted = sessionQuery.data?.status === "COMPLETED";
  const role = stateQuery.data?.role;

  const participantsQuery = useQuery({
    queryKey: ["sessions", sessionId, "participants"],
    queryFn: listParticipants,
    retry: false,
    enabled: isCompleted && Boolean(role),
  });

  const backToHistory: SummaryLink = { href: "/sessions", label: t("backToHistory") };
  const sessionStatus = getHttpStatus(sessionQuery.error);

  if (sessionStatus === HTTP_FORBIDDEN || sessionStatus === HTTP_NOT_FOUND) {
    return <SummaryMessage text={interview("sessionNotFound")} link={backToHistory} />;
  }

  if (sessionQuery.isError || stateQuery.isError || participantsQuery.isError) {
    return <SummaryMessage text={t("loadError")} link={backToHistory} />;
  }

  if (sessionQuery.isPending || stateQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  // Карточку сессии видит и автор заявки, но итоги - только участник
  if (!role) {
    return <SummaryMessage text={interview("sessionNotFound")} link={backToHistory} />;
  }

  if (!isCompleted) {
    return <SummaryMessage text={t("notCompleted")} link={{ href: `/sessions/${sessionId}`, label: session("openRoom") }} />;
  }

  if (participantsQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  const completed = toCompletedSession({
    ...sessionQuery.data,
    myRole: role,
    partners: participantsQuery.data.filter((participant) => participant.userId !== stateQuery.data.userId),
  });

  return (
    <>
      <SessionSummaryOverview session={completed} placeholder={placeholder} />

      <div className="mt-4 space-y-4">
        <SessionFeedbackPanel sessionId={sessionId} />
        {children}
      </div>
    </>
  );
}
