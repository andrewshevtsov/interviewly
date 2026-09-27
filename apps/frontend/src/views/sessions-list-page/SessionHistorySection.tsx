"use client";

// Слой views: клиентская граница для истории. Мок-история у каждого пользователя своя, а кто
// смотрит, фронт знает только из access-токена в памяти браузера - поэтому выбор на клиенте.
import { SessionHistory } from "@/widgets/session-history";
import { getSessionHistoryFor, type PastSession } from "@/entities/session";
import { useRequiredUserEmail } from "@/shared/api/use-required-user-email";
import { useTranslations } from "@/shared/i18n-context";

/**
 * Пропсы {@link SessionHistorySection}.
 */
export interface SessionHistorySectionProps {
  /**
   * Все прошедшие интервью, сначала новые - секция оставит только те, где участвовал пользователь.
   */
  sessions: PastSession[];
}

/**
 * Собственные прошедшие интервью текущего пользователя, либо заглушка загрузки, пока не
 * известно, кто смотрит (гостей отправляет на "/auth").
 * @param {SessionHistorySectionProps} props - пропсы секции.
 * @returns {import('react').ReactNode} История, либо заглушка загрузки.
 */
export function SessionHistorySection(props: SessionHistorySectionProps) {
  const { sessions } = props;
  const email = useRequiredUserEmail();
  const common = useTranslations("common");

  if (!email) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground">{common("loading")}</p>;
  }

  return <SessionHistory entries={getSessionHistoryFor(sessions, email)} />;
}
