"use client";

// Слой features: отклик на карточку витрины - окно с выбором своей роли и времени встречи.
// После отправки показывает, когда бот пришлёт ссылку на комнату.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";

import { getHttpMessage, getHttpStatus } from "@/shared/api/http-client";
import { TOGGLE_CHECKED_CLASSES, TOGGLE_UNCHECKED_CLASSES } from "@/shared/config/constants";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatDateTimeNumeric } from "@/shared/lib/format-date-time";
import { Badge } from "@/shared/ui/badge";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LocalizedLink } from "@/shared/ui/localized-link";
import type { Participant } from "@/entities/participant";
import {
  classifyRespondError,
  getSlotBounds,
  isSlotAllowed,
  localValueToIso,
  showcaseResponseApi,
  showcaseResponseKeys,
  toDateTimeLocalValue,
  type RespondErrorKey,
  type ResponseResult,
  type ShowcaseRole,
} from "@/entities/showcase-response";
import { useCurrentUser } from "@/entities/user";

/**
 * Вариант выбора роли в форме отклика.
 */
interface RoleOption {
  /**
   * Значение роли для backend.
   */
  value: ShowcaseRole;

  /**
   * Ключ перевода названия роли.
   */
  labelKey: "roleInterviewer" | "roleCandidate";

  /**
   * Ключ перевода пояснения к роли.
   */
  hintKey: "roleInterviewerHint" | "roleCandidateHint";
}

const ROLES: RoleOption[] = [
  { value: "INTERVIEWER", labelKey: "roleInterviewer", hintKey: "roleInterviewerHint" },
  { value: "CANDIDATE", labelKey: "roleCandidate", hintKey: "roleCandidateHint" },
];

const BLOCKED_VARIANTS = { PENDING: "warning", REJECTED: "muted", ACCEPTED: "success" } as const;

const BLOCKED_LABEL_KEYS = {
  PENDING: "cardWaiting",
  REJECTED: "cardWaiting",
  ACCEPTED: "cardMeetingScheduled",
} as const;

const ERROR_MESSAGE_KEYS = {
  invalidTime: "errInvalidTime",
  ownCard: "errOwnCard",
  cardGone: "errCardGone",
  noProfile: "errNoProfile",
  alreadyPending: "errAlreadyPending",
  meetingScheduled: "errMeetingScheduled",
  cooldown: "errCooldown",
  ownerBusy: "errOwnerBusy",
  youBusy: "errYouBusy",
  generic: "errGeneric",
} as const satisfies Record<RespondErrorKey, string>;

/**
 * Пропсы {@link RespondForm}.
 */
interface RespondFormProps {
  /**
   * Карточка, на которую откликаемся.
   */
  participant: Participant;

  /**
   * Закрывает окно.
   */
  onClose: () => void;
}

/**
 * Форма отклика: роль, время встречи, отправка и итог. Живёт пока окно открыто,
 * каждое открытие начинается с чистой формы.
 * @param {RespondFormProps} props - Карточка и закрытие окна.
 * @returns {import('react').ReactNode} Форма или экран "отклик отправлен".
 */
function RespondForm(props: RespondFormProps) {
  const { participant, onClose } = props;
  const locale = useLocale();
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const showcase = useTranslations("showcase");
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [role, setRole] = useState<ShowcaseRole>("CANDIDATE");
  const [slot, setSlot] = useState("");
  const [bounds] = useState(() => getSlotBounds(new Date()));

  const respondMutation = useMutation({
    /**
     * Отправляет отклик с выбранными ролью и временем.
     * @returns {Promise<ResponseResult>} Созданный отклик.
     */
    mutationFn: () => showcaseResponseApi.respond(participant.id, { role, scheduledAt: localValueToIso(slot) }),
    /**
     * Обновляет исходящие отклики и карточки витрины: на карточке появится «ожидаем ответ».
     * @returns {Promise<void[]>} Завершается, когда списки перезапрошены.
     */
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.outgoing }),
        queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.cards }),
      ]),
  });

  /**
   * Отправляет отклик, если время проходит проверку.
   * @param {SubmitEvent<HTMLFormElement>} event - Submit формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isSlotAllowed(slot, new Date())) {
      respondMutation.mutate();
    }
  }

  if (respondMutation.isSuccess) {
    const result: ResponseResult = respondMutation.data;
    const hasTelegram = currentUser.data ? currentUser.data.telegramId !== null : true;

    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>{participant.name}</DialogTitle>
          <DialogDescription>{t("respondSuccess")}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {t("reminderNote")} <span className="font-medium">{formatDateTime(result.reminderAt, locale)}</span>
        </p>
        {!hasTelegram && <p className="text-sm text-muted-foreground">{showcase("telegramHintText")}</p>}
        <DialogFooter>
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogFooter>
      </div>
    );
  }

  const error = respondMutation.isError
    ? classifyRespondError(getHttpStatus(respondMutation.error), getHttpMessage(respondMutation.error))
    : null;
  const isSlotInvalid = slot !== "" && !isSlotAllowed(slot, new Date());

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{t("respondTitle")}</DialogTitle>
        <DialogDescription>
          {participant.name}. {t("respondDescription")}
        </DialogDescription>
      </DialogHeader>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium leading-none">{t("yourRole")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((item) => (
            <label key={item.value} className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value={item.value}
                checked={role === item.value}
                onChange={() => setRole(item.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "block rounded-md border px-4 py-3 text-sm",
                  TOGGLE_UNCHECKED_CLASSES,
                  TOGGLE_CHECKED_CLASSES,
                )}
              >
                <span className="block font-medium capitalize">{t(item.labelKey)}</span>
                <span className="block text-xs opacity-80">{t(item.hintKey)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="respond-slot">{t("dateTimeLabel")}</Label>
        <Input
          id="respond-slot"
          type="datetime-local"
          required
          min={toDateTimeLocalValue(bounds.min)}
          max={toDateTimeLocalValue(bounds.max)}
          value={slot}
          onChange={(event) => setSlot(event.target.value)}
        />
        <p className={cn("text-xs", isSlotInvalid ? "text-destructive" : "text-muted-foreground")}>
          {t("dateTimeHint")}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t(ERROR_MESSAGE_KEYS[error.key])}
          {error.retryAt && <> {formatDateTime(error.retryAt, locale)}</>}
          {error.key === "noProfile" && (
            <>
              {" "}
              <LocalizedLink href="/profile" className="underline">
                {t("fillProfile")}
              </LocalizedLink>
            </>
          )}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {common("cancel")}
        </Button>
        <Button type="submit" isLoading={respondMutation.isPending} disabled={slot === "" || isSlotInvalid}>
          {respondMutation.isPending ? t("sending") : t("send")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Пропсы {@link RespondToCard}.
 */
export interface RespondToCardProps {
  /**
   * Карточка, на которую можно откликнуться.
   */
  participant: Participant;
}

/**
 * Кнопка "откликнуться" и окно с формой отклика.
 * @param {RespondToCardProps} props - Карточка участника.
 * @returns {import('react').ReactNode} Кнопка с окном.
 */
export function RespondToCard(props: RespondToCardProps) {
  const { participant } = props;
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const showcase = useTranslations("showcase");
  const t = useTranslations("showcaseResponses");
  const { myResponse } = participant;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col items-end gap-2">
        {myResponse && (
          <Badge
            variant={BLOCKED_VARIANTS[myResponse.status]}
            className={cn("uppercase", myResponse.status === "REJECTED" && "text-[8px]")}
          >
            {myResponse.status === "REJECTED" && myResponse.canRetryAt
              ? `${t("cardRetryAfter")} ${formatDateTimeNumeric(myResponse.canRetryAt, locale)}`
              : t(BLOCKED_LABEL_KEYS[myResponse.status])}
          </Badge>
        )}
        <DialogTrigger asChild>
          <Button variant="outline" disabled={myResponse !== null}>
            {showcase("respond")}
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent closeLabel={t("close")}>
        <RespondForm participant={participant} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
