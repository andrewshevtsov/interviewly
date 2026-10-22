"use client";

// Слой features: владелец передаёт комнату другому интервьюеру
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { formatUserName, sessionApi } from "@/entities/session";

const POLL_INTERVAL_MS = 5000;

/**
 * Пропсы {@link TransferOwnershipPanel}.
 */
export interface TransferOwnershipPanelProps {
  /**
   * Передаваемая сессия
   */
  sessionId: string;

  /**
   * UUID текущего владельца
   */
  currentUserId: string;
}

/**
 * Список других интервьюеров сессии с кнопкой "сделать владельцем", виден только владельцу
 * Если других интервьюеров нет (или список ещё грузится), блок не показывается
 * @param {TransferOwnershipPanelProps} props - Пропсы панели
 * @returns {import('react').ReactNode} Панель передачи владения
 */
export function TransferOwnershipPanel(props: TransferOwnershipPanelProps) {
  const { sessionId, currentUserId } = props;
  const queryClient = useQueryClient();
  const t = useTranslations("session");

  /**
   * Загружает участников сессии
   * @returns {ReturnType<typeof sessionApi.listParticipants>} Участники
   */
  function listParticipants() {
    return sessionApi.listParticipants(sessionId);
  }

  const participantsQuery = useQuery({
    queryKey: ["sessions", sessionId, "participants"],
    queryFn: listParticipants,
    refetchInterval: POLL_INTERVAL_MS,
  });

  /**
   * Делает указанного интервьюера владельцем сессии
   * @param {string} userId - UUID нового владельца
   * @returns {Promise<void>} Завершается, когда владение передано
   */
  function transfer(userId: string) {
    return sessionApi.transferOwnership(sessionId, userId);
  }

  /**
   * Перезапрашивает состояние: если больше не владелец, панели владельца исчезают
   * @returns {Promise<void>} Завершается, когда состояние перезапрошено
   */
  function refreshMyState() {
    return queryClient.invalidateQueries({ queryKey: ["sessions", sessionId, "me"] });
  }

  const transferMutation = useMutation({ mutationFn: transfer, onSuccess: refreshMyState });
  const targets =
    participantsQuery.data?.filter(
      (participant) => participant.role === "INTERVIEWER" && participant.userId !== currentUserId,
    ) ?? [];

  if (targets.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("transferOwnershipTitle")}
      </p>
      <p className="text-xs text-muted-foreground">{t("transferOwnershipHint")}</p>

      {targets.map((participant) => (
        <div key={participant.userId} className="flex items-center justify-between gap-2">
          <p className="text-sm">{formatUserName(participant.user)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={transferMutation.isPending}
            onClick={() => transferMutation.mutate(participant.userId)}
          >
            {t("transferOwnership")}
          </Button>
        </div>
      ))}

      {transferMutation.isError && <p className="text-sm text-destructive">{t("transferOwnershipError")}</p>}
    </Card>
  );
}
