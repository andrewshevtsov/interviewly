"use client";

// Слой features: отмена назначенной встречи.
// Второй участник получает уведомление, слот освобождается.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { showcaseResponseApi, showcaseResponseKeys } from "@/entities/showcase-response";

/**
 * Пропсы {@link CancelMeeting}.
 */
export interface CancelMeetingProps {
  /**
   * Сессия, созданная при принятии отклика.
   */
  sessionId: string;
}

/**
 * Кнопка «отменить встречу» с окном подтверждения.
 * @param {CancelMeetingProps} props - Сессия встречи.
 * @returns {import('react').ReactNode} Кнопка с окном.
 */
export function CancelMeeting(props: CancelMeetingProps) {
  const { sessionId } = props;
  const [open, setOpen] = useState(false);
  const t = useTranslations("showcaseResponses");
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    /**
     * Отменяет встречу на сервере.
     * @returns {Promise<void>} Завершается после отмены.
     */
    mutationFn: () => showcaseResponseApi.cancelMeeting(sessionId),
    /**
     * Закрывает окно и обновляет оба списка: у откликов появится «встреча отменена».
     * @returns {Promise<void[]>} Завершается, когда списки перезапрошены.
     */
    onSuccess: () => {
      setOpen(false);

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.incoming }),
        queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.outgoing }),
      ]);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        cancelMutation.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("cancelMeeting")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("cancelMeetingTitle")}</DialogTitle>
          <DialogDescription>{t("cancelMeetingText")}</DialogDescription>
        </DialogHeader>
        {cancelMutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t("cancelMeetingError")}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancelMeetingKeep")}
          </Button>
          <Button type="button" isLoading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
            {cancelMutation.isPending ? t("cancelMeetingPending") : t("cancelMeetingConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
