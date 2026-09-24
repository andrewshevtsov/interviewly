"use client";

// Слой features: панель владельца с заявками на допуск в комнату.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { formatUserName, sessionApi } from "@/entities/session";

const POLL_INTERVAL_MS = 3000;

/**
 * Пропсы {@link AccessRequestsPanel}.
 */
export interface AccessRequestsPanelProps {
  /**
   * Сессия, заявки которой показываются; смотрящий должен быть её владельцем.
   */
  sessionId: string;
}

/**
 * Решение владельца по заявке.
 */
interface ReviewDecision {
  /**
   * UUID заявки.
   */
  requestId: string;

  /**
   * `true` - впустить автора заявки, `false` - отказать.
   */
  approve: boolean;
}

/**
 * Список ожидающих заявок с кнопками "принять"/"отклонить", виден только владельцу.
 * @param {AccessRequestsPanelProps} props - Пропсы панели.
 * @returns {import('react').ReactNode} Панель заявок на вход.
 */
export function AccessRequestsPanel(props: AccessRequestsPanelProps) {
  const { sessionId } = props;
  const queryClient = useQueryClient();
  const t = useTranslations("session");
  const queryKey = ["sessions", sessionId, "access-requests"];

  /**
   * Загружает заявки этой сессии.
   * @returns {ReturnType<typeof sessionApi.listAccessRequests>} Все заявки, сначала новые.
   */
  function listRequests() {
    return sessionApi.listAccessRequests(sessionId);
  }

  const requestsQuery = useQuery({ queryKey, queryFn: listRequests, refetchInterval: POLL_INTERVAL_MS });

  /**
   * Одобряет или отклоняет заявку.
   * @param {ReviewDecision} decision - Какая заявка и что с ней сделать.
   * @returns {Promise<void>} Завершается, когда бэкенд сохранил решение.
   */
  function review(decision: ReviewDecision) {
    return decision.approve
      ? sessionApi.approveAccessRequest(sessionId, decision.requestId)
      : sessionApi.rejectAccessRequest(sessionId, decision.requestId);
  }

  /**
   * Перезапрашивает список, чтобы рассмотренная заявка исчезла.
   * @returns {Promise<void>} Завершается, когда список перезапрошен.
   */
  function refreshRequests() {
    return queryClient.invalidateQueries({ queryKey });
  }

  const reviewMutation = useMutation({ mutationFn: review, onSettled: refreshRequests });
  const pending = requestsQuery.data?.filter((request) => request.status === "PENDING") ?? [];

  // Опрос заявок продолжается и без блока: он появится с первой новой заявкой.
  if (pending.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("accessRequestsTitle")}
      </p>

      {pending.map((request) => (
        <div key={request.id} className="space-y-2">
          <p className="text-sm">
            {formatUserName(request.requester)}
            <span className="block text-xs text-muted-foreground">{request.requester.email}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ requestId: request.id, approve: true })}
            >
              {t("approveRequest")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ requestId: request.id, approve: false })}
            >
              {t("rejectRequest")}
            </Button>
          </div>
        </div>
      ))}

      {reviewMutation.isError && <p className="text-sm text-destructive">{t("reviewRequestError")}</p>}
    </Card>
  );
}
