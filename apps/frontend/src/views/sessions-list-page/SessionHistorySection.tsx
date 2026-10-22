"use client";

// Слой views: клиентская граница для истории. Access-токен живёт только в памяти браузера,
// поэтому история запрашивается у бэкенда на клиенте
import { useQuery } from "@tanstack/react-query";

import { SessionHistory } from "@/widgets/session-history";
import { sessionApi, toCompletedSession, type PastSession } from "@/entities/session";
import { useGuestRedirect } from "@/shared/api/use-guest-redirect";
import { useTranslations } from "@/shared/i18n-context";

/**
 * Пропсы {@link SessionHistorySection}.
 */
export interface SessionHistorySectionProps {
  /**
   * Мок-интервью - источник значений для размытых блоков
   */
  placeholder: PastSession;
}

/**
 * Завершённые интервью текущего пользователя, либо заглушка загрузки или ошибки
 * Гостя отправляет на "/auth"
 * @param {SessionHistorySectionProps} props - пропсы секции.
 * @returns {import('react').ReactNode} История, заглушка загрузки или сообщение об ошибке
 */
export function SessionHistorySection(props: SessionHistorySectionProps) {
  const { placeholder } = props;
  const common = useTranslations("common");
  const t = useTranslations("session");
  useGuestRedirect();

  const historyQuery = useQuery({
    queryKey: ["sessions", "history"],
    queryFn: sessionApi.history,
    retry: false,
  });

  if (historyQuery.isPending) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground">{common("loading")}</p>;
  }

  if (historyQuery.isError) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-destructive">{t("historyLoadError")}</p>;
  }

  return <SessionHistory entries={historyQuery.data.map(toCompletedSession)} placeholder={placeholder} />;
}
