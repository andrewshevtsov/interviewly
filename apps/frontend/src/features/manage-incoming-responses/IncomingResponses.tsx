"use client";

// Слой features: отклики на мою карточку - владелец видит, кто пришёл и в какой роли, и принимает
// отклик (создаётся сессия) или отклоняет его с причиной. Обновление каждые 10 секунд.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getHttpMessage, getHttpStatus } from "@/shared/api/http-client";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import {
  classifyReviewError,
  ResponseStatusBadge,
  ROLE_LABEL_KEYS,
  showcaseResponseApi,
  showcaseResponseKeys,
  type IncomingResponse,
  type ReviewErrorKey,
} from "@/entities/showcase-response";

import { RejectResponseDialog } from "./RejectResponseDialog";

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
 * Пропсы {@link IncomingResponseItem}.
 */
interface IncomingResponseItemProps {
  /**
   * Отклик на мою карточку.
   */
  response: IncomingResponse;

  /**
   * Дополнительные действия под откликом (чат, отмена встречи): собирает виджет.
   */
  renderActions?: (response: IncomingResponse) => ReactNode;
}

/**
 * Одна карточка отклика: кто, роли, время и действия владельца.
 * @param {IncomingResponseItemProps} props - Отклик.
 * @returns {import('react').ReactNode} Карточка отклика.
 */
function IncomingResponseItem(props: IncomingResponseItemProps) {
  const { response, renderActions } = props;
  const locale = useLocale();
  const t = useTranslations("showcaseResponses");
  const profile = useTranslations("profile");
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    /**
     * Принимает отклик: backend создаёт сессию на предложенное время.
     * @returns {Promise<import('@/entities/showcase-response').ResponseResult>} Принятый отклик.
     */
    mutationFn: () => showcaseResponseApi.accept(response.id),
    /**
     * Обновляет список: отклик станет принятым со ссылкой на комнату.
     * @returns {Promise<void>} Завершается, когда список перезапрошен.
     */
    onSuccess: () => queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.incoming }),
  });

  const errorKey = acceptMutation.isError
    ? classifyReviewError(getHttpStatus(acceptMutation.error), getHttpMessage(acceptMutation.error))
    : null;
  const { responder } = response;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{responder.name}</p>
          <p className="text-sm text-muted-foreground">
            {responder.title}
            {responder.level && <> · <span className="text-primary">{profile(responder.level as "junior")}</span></>}
          </p>
        </div>
        <ResponseStatusBadge status={response.status} />
      </div>

      {responder.bio && <p className="text-sm text-muted-foreground">{responder.bio}</p>}

      {responder.stack.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {responder.stack.map((tech) => (
            <Badge key={tech} variant="muted" className="rounded-md text-[10px] uppercase tracking-wide">
              {tech}
            </Badge>
          ))}
        </div>
      )}

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("meetingAt")}</dt>
          <dd className="font-medium">{formatDateTime(response.scheduledAt, locale)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("wantsToBe")}</dt>
          <dd className="font-medium capitalize">{t(ROLE_LABEL_KEYS[response.role])}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("youWillBe")}</dt>
          <dd className="font-medium capitalize">{t(ROLE_LABEL_KEYS[response.ownerRole])}</dd>
        </div>
      </dl>

      {response.status === "PENDING" && (
        <div className="flex flex-wrap gap-2">
          <Button isLoading={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
            {acceptMutation.isPending ? t("accepting") : t("accept")}
          </Button>
          <RejectResponseDialog responseId={response.id} />
        </div>
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

      {response.status === "REJECTED" && response.rejectionReason && (
        <p className="text-sm text-muted-foreground">
          {t("rejectedReason")}: {response.rejectionReason}
        </p>
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
 * Пропсы {@link IncomingResponses}.
 */
export interface IncomingResponsesProps {
  /**
   * Дополнительные действия под откликом (чат, отмена встречи): собирает виджет.
   */
  renderActions?: (response: IncomingResponse) => ReactNode;
}

/**
 * Список откликов на мою карточку: сначала ждущие решения, потом остальные.
 * @param {IncomingResponsesProps} props - Дополнительные действия под откликом.
 * @returns {import('react').ReactNode} Список откликов или сообщение о загрузке, ошибке, пустоте.
 */
export function IncomingResponses(props: IncomingResponsesProps) {
  const { renderActions } = props;
  const queryClient = useQueryClient();
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const incomingQuery = useQuery({
    queryKey: showcaseResponseKeys.incoming,
    /**
     * Загружает входящие.
     * @returns {Promise<IncomingResponse[]>} Последние отклики на мою карточку.
     */
    queryFn: async () => {
      const responses = await showcaseResponseApi.incoming();
      await queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.newEvents });

      return responses;
    },
    refetchInterval: POLL_INTERVAL_MS,
  });

  if (incomingQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  if (incomingQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" onClick={() => void incomingQuery.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const pending = incomingQuery.data.filter((response) => response.status === "PENDING");
  const reviewed = incomingQuery.data.filter((response) => response.status !== "PENDING");

  if (incomingQuery.data.length === 0) {
    return <p className="text-muted-foreground">{t("incomingEmpty")}</p>;
  }

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("pendingHeading")}</h2>
          {pending.map((response) => (
            <IncomingResponseItem key={response.id} response={response} renderActions={renderActions} />
          ))}
        </section>
      )}

      {reviewed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("reviewedHeading")}</h2>
          {reviewed.map((response) => (
            <IncomingResponseItem key={response.id} response={response} renderActions={renderActions} />
          ))}
        </section>
      )}
    </div>
  );
}
