"use client";

// Слой features: AI-подсказки
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getHttpStatus } from "@/shared/api/http-client";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  appendSessionHint,
  formatUserName,
  sessionApi,
  useSessionHints,
  type ApiSessionHint,
} from "@/entities/session";

const HTTP_CONFLICT = 409;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_GATEWAY_TIMEOUT = 504;
const AI_UNAVAILABLE_STATUSES = new Set([HTTP_BAD_GATEWAY, HTTP_SERVICE_UNAVAILABLE, HTTP_GATEWAY_TIMEOUT]);

/**
 * Пропсы {@link AiHintsPanel}.
 */
export interface AiHintsPanelProps {
  /**
   * Сессия, к которой относятся подсказки.
   */
  sessionId: string;

  /**
   * Текущий пользователь - кандидат (запрашивает подсказки)
   */
  isCandidate: boolean;

  /**
   * Интервью идёт (сессия ACTIVE) - иначе бэкенд подсказку не выдаст
   */
  isActive: boolean;
}

/**
 * Ключ перевода для ошибки запроса подсказки
 * @param {unknown} error - Ошибка запроса
 * @returns {"aiHintLimitError" | "aiHintUnavailableError" | "aiHintError"} Ключ перевода
 */
function errorKey(error: unknown): "aiHintLimitError" | "aiHintUnavailableError" | "aiHintError" {
  const status = getHttpStatus(error);
  if (status === HTTP_CONFLICT) {
    return "aiHintLimitError";
  }
  if (status !== undefined && AI_UNAVAILABLE_STATUSES.has(status)) {
    return "aiHintUnavailableError";
  }

  return "aiHintError";
}

/**
 * Список AI-подсказок сессии со счётчиком; кнопка запроса для кандидата
 * @param {AiHintsPanelProps} props - Пропсы панели
 * @returns {import('react').ReactNode} Панель подсказок
 */
export function AiHintsPanel(props: AiHintsPanelProps) {
  const { sessionId, isCandidate, isActive } = props;
  const queryClient = useQueryClient();
  const hintsQuery = useSessionHints(sessionId);
  const t = useTranslations("session");
  const hints = hintsQuery.data?.hints ?? [];
  const remaining = hintsQuery.data?.remaining ?? 0;
  const limit = hintsQuery.data?.limit ?? 0;

  /**
   * Запрашивает подсказку у бэкенда; условие и код бэкенд берёт из текущей демо-задачи
   * @returns {ReturnType<typeof sessionApi.requestHint>} Новая подсказка
   */
  function requestHint() {
    return sessionApi.requestHint(sessionId);
  }

  /**
   * Показывает подсказку автору, не дожидаясь события из сокета
   * @param {ApiSessionHint} hint - Новая подсказка
   * @returns {void}
   */
  function showHint(hint: ApiSessionHint): void {
    appendSessionHint(queryClient, sessionId, hint);
  }

  const requestMutation = useMutation({ mutationFn: requestHint, onSuccess: showHint });

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold uppercase tracking-wide">
        {t("aiHintsTitle")} {hintsQuery.data && `(${remaining}/${limit})`}
      </p>

      {isCandidate && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full uppercase tracking-wide"
            disabled={!isActive || !hintsQuery.data || remaining === 0}
            isLoading={requestMutation.isPending}
            onClick={() => requestMutation.mutate()}
          >
            {requestMutation.isPending ? t("aiHintPending") : t("aiHint")}
          </Button>
          {!isActive && <p className="text-xs text-muted-foreground">{t("aiHintWaitActive")}</p>}
          {requestMutation.isError && (
            <p className="text-sm text-destructive">{t(errorKey(requestMutation.error))}</p>
          )}
        </>
      )}

      {hints.length === 0
        ? (
          <p className="text-sm text-muted-foreground">{t("aiHintsEmpty")}</p>
        )
        : (
          <ol className="space-y-3">
            {hints.map((hint) => (
              <li key={hint.id} className="space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">
                  #{hint.order} · {formatUserName(hint.requestedBy)} ·{" "}
                  {new Date(hint.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>{hint.text}</p>
              </li>
            ))}
          </ol>
        )}
    </Card>
  );
}
