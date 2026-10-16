"use client";

// Слой features: окно отказа на отклик - причина (30-500 символов)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";

import { getHttpMessage, getHttpStatus } from "@/shared/api/http-client";
import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
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
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  classifyReviewError,
  isReasonLengthValid,
  REASON_MAX_LENGTH,
  showcaseResponseApi,
  showcaseResponseKeys,
  type ReviewErrorKey,
} from "@/entities/showcase-response";

const REVIEW_ERROR_KEYS = {
  alreadyReviewed: "revAlreadyReviewed",
  timePassed: "revTimePassed",
  youBusy: "revYouBusy",
  responderBusy: "revResponderBusy",
  notAllowed: "revNotAllowed",
  generic: "revGeneric",
} as const satisfies Record<ReviewErrorKey, string>;

/**
 * Пропсы {@link RejectForm}.
 */
interface RejectFormProps {
  /**
   * Отклик, который отклоняем.
   */
  responseId: string;

  /**
   * Закрывает окно.
   */
  onClose: () => void;
}

/**
 * Форма отказа: причина со счётчиком символов и флажок "неудобное время".
 * @param {RejectFormProps} props - Отклик и закрытие окна.
 * @returns {import('react').ReactNode} Форма отказа.
 */
function RejectForm(props: RejectFormProps) {
  const { responseId, onClose } = props;
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [timeMismatch, setTimeMismatch] = useState(false);

  const rejectMutation = useMutation({
    /**
     * Отправляет отказ с причиной.
     * @returns {Promise<import('@/entities/showcase-response').ResponseResult>} Отклонённый отклик.
     */
    mutationFn: () => showcaseResponseApi.reject(responseId, { reason: reason.trim(), timeMismatch }),
    /**
     * Обновляет список входящих и закрывает окно.
     * @returns {Promise<void>} Завершается, когда список перезапрошен.
     */
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.incoming });
      onClose();
    },
  });

  const length = reason.trim().length;
  const isValid = isReasonLengthValid(reason);
  const errorKey = rejectMutation.isError
    ? classifyReviewError(getHttpStatus(rejectMutation.error), getHttpMessage(rejectMutation.error))
    : null;

  /**
   * Сабмит формы отказа.
   * @param {SubmitEvent<HTMLFormElement>} event - Submit формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isValid) {
      rejectMutation.mutate();
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{t("rejectTitle")}</DialogTitle>
        <DialogDescription>{t("rejectDescription")}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="reject-reason">{t("reasonLabel")}</Label>
        <Textarea
          id="reject-reason"
          rows={5}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("reasonHint")}</span>
          <span className={cn(length > 0 && !isValid ? "text-destructive" : "text-muted-foreground")}>
            {length} / {REASON_MAX_LENGTH}
          </span>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={timeMismatch}
          onChange={(event) => setTimeMismatch(event.target.checked)}
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span className="text-sm">{t("timeMismatchLabel")}</span>
      </label>

      {errorKey && (
        <p className="text-sm text-destructive" role="alert">
          {t(REVIEW_ERROR_KEYS[errorKey])}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {common("cancel")}
        </Button>
        <Button type="submit" variant="destructive" isLoading={rejectMutation.isPending} disabled={!isValid}>
          {rejectMutation.isPending ? t("rejecting") : t("sendRejection")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Пропсы {@link RejectResponseDialog}.
 */
export interface RejectResponseDialogProps {
  /**
   * Отклик, который можно отклонить.
   */
  responseId: string;
}

/**
 * Кнопка "отклонить" с окном причины отказа.
 * @param {RejectResponseDialogProps} props - Отклик.
 * @returns {import('react').ReactNode} Кнопка с окном.
 */
export function RejectResponseDialog(props: RejectResponseDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("showcaseResponses");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("reject")}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <RejectForm responseId={props.responseId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
