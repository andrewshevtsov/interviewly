"use client";

// Слой features: мои отклики на другие карточки - статус, причина отказа, когда можно повторить,
// и отзыв отклика, пока он в ожидании. Список обновляется раз в 10 секунд.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getHttpMessage, getHttpStatus } from "@/shared/api/http-client";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import {
  classifyReviewError,
  ResponseStatusBadge,
  ROLE_LABEL_KEYS,
  showcaseResponseApi,
  showcaseResponseKeys,
  type OutgoingResponse,
  type ReviewErrorKey,
} from "@/entities/showcase-response";

const POLL_INTERVAL_MS = 10_000;

const REVIEW_ERROR_KEYS = {
  alreadyReviewed: "revAlreadyReviewed",
  timePassed: "revTimePassed",
  youBusy: "revYouBusy",
  responderBusy: "revResponderBusy",
  notAllowed: "revNotAllowed",
  generic: "revGeneric",
} as const satisfies Record<ReviewErrorKey, string>;

/**
 * Пропсы {@link OutgoingResponseItem}.
 */
interface OutgoingResponseItemProps {
  /**
   * Мой отклик на чужую карточку.
   */
  response: OutgoingResponse;

  /**
   * Дополнительные действия под откликом (чат, отмена встречи): собирает виджет.
   */
  renderActions?: (response: OutgoingResponse) => ReactNode;
}

/**
 * Одна карточка моего отклика: на чью карточку, роль, время, статус и действия.
 * @param {OutgoingResponseItemProps} props - Отклик.
 * @returns {import('react').ReactNode} Карточка отклика.
 */
function OutgoingResponseItem(props: OutgoingResponseItemProps) {
  const { response, renderActions } = props;
  const locale = useLocale();
  const t = useTranslations("showcaseResponses");
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    /**
     * Отзывает отклик, пока владелец не принял решение.
     * @returns {Promise<import('@/entities/showcase-response').ResponseResult>} Отозванный отклик.
     */
    mutationFn: () => showcaseResponseApi.cancel(response.id),
    /**
     * Обновляет список: отклик станет отозванным.
     * @returns {Promise<void>} Завершается, когда список перезапрошен.
     */
    onSuccess: () => queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.outgoing }),
  });

  const hasRetryNote = response.timeMismatch || response.canRetryAt !== null;
  const errorKey = cancelMutation.isError
    ? classifyReviewError(getHttpStatus(cancelMutation.error), getHttpMessage(cancelMutation.error))
    : null;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("toCard")}</p>
          <p className="font-semibold">{response.card.name}</p>
          <p className="text-sm text-muted-foreground">{response.card.title}</p>
        </div>
        <ResponseStatusBadge status={response.status} />
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("meetingAt")}</dt>
          <dd className="font-medium">{formatDateTime(response.scheduledAt, locale)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("myRole")}</dt>
          <dd className="font-medium capitalize">{t(ROLE_LABEL_KEYS[response.role])}</dd>
        </div>
      </dl>

      {response.status === "PENDING" && (
        <Button variant="outline" isLoading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
          {cancelMutation.isPending ? t("cancelling") : t("cancelResponse")}
        </Button>
      )}

      {response.status === "ACCEPTED" && response.sessionStatus === "CANCELLED" && (
        <p className="text-sm text-destructive">{t("meetingCancelled")}</p>
      )}

      {response.status === "ACCEPTED" && response.sessionStatus !== "CANCELLED" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("acceptedNote")}</p>
          {response.sessionId && (
            <Button asChild variant="outline" size="sm">
              <LocalizedLink href={`/sessions/${response.sessionId}`}>{t("openSession")}</LocalizedLink>
            </Button>
          )}
        </div>
      )}

      {response.status === "REJECTED" && (
        <div className="space-y-2 text-sm">
          {response.timeMismatch && <p className="border-t border-border pt-2 text-warning">{t("canRetryNow")}</p>}
          {!response.timeMismatch && response.canRetryAt && (
            <p className="border-t border-border pt-2 text-warning">
              {t("canRetryAfter")} {formatDateTime(response.canRetryAt, locale)}
            </p>
          )}
          {response.rejectionReason && (
            <p className={cn("text-muted-foreground", !hasRetryNote && "border-t border-border pt-2")}>
              {t("rejectedReason")}: {response.rejectionReason}
            </p>
          )}
        </div>
      )}

      {renderActions && <div className="flex flex-wrap gap-2">{renderActions(response)}</div>}

      {errorKey && (
        <p className="text-sm text-destructive" role="alert">
          {t(REVIEW_ERROR_KEYS[errorKey])}
        </p>
      )}
    </Card>
  );
}

/**
 * Пропсы {@link OutgoingResponses}.
 */
export interface OutgoingResponsesProps {
  /**
   * Дополнительные действия под откликом (чат, отмена встречи): собирает виджет.
   */
  renderActions?: (response: OutgoingResponse) => ReactNode;
}

/**
 * Список моих откликов на другие карточки.
 * @param {OutgoingResponsesProps} props - Дополнительные действия под откликом.
 * @returns {import('react').ReactNode} Список откликов или сообщение о загрузке, ошибке, пустоте.
 */
export function OutgoingResponses(props: OutgoingResponsesProps) {
  const { renderActions } = props;
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const outgoingQuery = useQuery({
    queryKey: showcaseResponseKeys.outgoing,
    /**
     * Загружает мои отклики.
     * @returns {Promise<OutgoingResponse[]>} Последние отклики на чужие карточки.
     */
    queryFn: async () => {
      const responses = await showcaseResponseApi.outgoing();
      await queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.newEvents });

      return responses;
    },
    refetchInterval: POLL_INTERVAL_MS,
  });

  if (outgoingQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  if (outgoingQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" onClick={() => void outgoingQuery.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (outgoingQuery.data.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">{t("outgoingEmpty")}</p>
        <Button asChild variant="outline">
          <LocalizedLink href="/showcase">{t("goToShowcase")}</LocalizedLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outgoingQuery.data.map((response) => (
        <OutgoingResponseItem key={response.id} response={response} renderActions={renderActions} />
      ))}
    </div>
  );
}
