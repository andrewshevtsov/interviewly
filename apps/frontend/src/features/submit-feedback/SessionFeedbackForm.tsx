"use client";

// Слой features: форма обратной связи по завершённой сессии - кому она адресована,
// оценка 0-10 и комментарий. Отправляет реальный POST /sessions/:sessionId/feedback.
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { MAX_SESSION_SCORE } from "@/shared/config/constants";
import { feedbackApi, type CreateFeedbackInput } from "@/entities/feedback";
import { sessionApi } from "@/entities/session";

const INCLUSIVE_RANGE_OFFSET = 1;
const SCORE_OPTIONS = Array.from(
  { length: MAX_SESSION_SCORE + INCLUSIVE_RANGE_OFFSET },
  (unusedEntry, score) => score,
);

/**
 * Props for {@link SessionFeedbackForm}.
 */
export interface SessionFeedbackFormProps {
  /**
   * Session the feedback is about.
   */
  sessionId: string;

  /**
   * Score selected by default when the form is first shown.
   */
  defaultScore: number;
}

/**
 * Session feedback form: pick the participant it's about, a 0-10 score and a comment.
 * Saving posts to the backend and returns to "История" on success.
 * @param {SessionFeedbackFormProps} props - Props for the form.
 * @returns {import('react').ReactNode} The session feedback form.
 */
export function SessionFeedbackForm(props: SessionFeedbackFormProps) {
  const { sessionId, defaultScore } = props;
  const router = useRouter();
  const locale = useLocale();
  const [score, setScore] = useState(defaultScore);
  const t = useTranslations("feedback");
  const common = useTranslations("common");

  /**
   * Fetches the current user's role in this session.
   * @returns {ReturnType<typeof sessionApi.getMyState>} The user's state in the session.
   */
  function getMyState() {
    return sessionApi.getMyState(sessionId);
  }

  const myStateQuery = useQuery({
    queryKey: ["sessions", sessionId, "me"],
    queryFn: getMyState,
    retry: false,
  });

  /**
   * Lists the session's other participants, eligible as feedback targets.
   * @returns {ReturnType<typeof feedbackApi.listEligibleTargets>} The other participants.
   */
  function listEligibleTargets() {
    return feedbackApi.listEligibleTargets(sessionId);
  }

  const isInterviewer = myStateQuery.data?.role === "INTERVIEWER";

  const participantsQuery = useQuery({
    queryKey: ["sessions", sessionId, "feedback-participants"],
    queryFn: listEligibleTargets,
    retry: false,
    enabled: isInterviewer,
  });

  /**
   * Submits the feedback for the current session.
   * @param {CreateFeedbackInput} input - The feedback fields.
   * @returns {Promise<import("@/entities/feedback").Feedback>} The created feedback.
   */
  function createFeedback(input: CreateFeedbackInput) {
    return feedbackApi.create(sessionId, input);
  }

  /**
   * Returns to "История" once the feedback has been saved.
   * @returns {void}
   */
  function handleSubmitSuccess(): void {
    router.push(getLocalizedHref("/sessions", locale));
  }

  const submitMutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: handleSubmitSuccess,
  });

  /**
   * Reads the target participant and comment from the native form, and submits
   * them together with the `score` state to the backend.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const { targetUserId, comment } = Object.fromEntries(formData) as Record<
      "targetUserId" | "comment",
      string
    >;

    submitMutation.mutate({ targetUserId, score, comment });
  }

  if (myStateQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  if (!isInterviewer) {
    return (
      <Card className="p-8">
        <p className="text-muted-foreground">{t("interviewerOnly")}</p>
        <Button asChild variant="outline" className="mt-6">
          <LocalizedLink href="/sessions">{t("backToHistory")}</LocalizedLink>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="feedback-target">{t("targetLabel")}</Label>
          {participantsQuery.isError && (
            <p className="text-sm text-destructive">{t("targetLoadError")}</p>
          )}
          <Select
            id="feedback-target"
            name="targetUserId"
            required
            disabled={participantsQuery.isPending}
            defaultValue=""
          >
            <option value="" disabled>
              {participantsQuery.isPending ? t("targetLoading") : t("targetPlaceholder")}
            </option>
            {participantsQuery.data?.map((participant) => (
              <option key={participant.userId} value={participant.userId}>
                {participant.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            {t("scoreLabel")}: <span className="text-primary">{score}</span> /{" "}
            {MAX_SESSION_SCORE}
          </Label>
          <div className="grid grid-cols-11 gap-1.5">
            {SCORE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScore(option)}
                className={cn(
                  "rounded-md border py-2 font-mono text-sm font-medium transition-colors",
                  score === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-comment">{t("commentLabel")}</Label>
          <Textarea id="feedback-comment" name="comment" placeholder={t("commentPlaceholder")} />
        </div>

        {submitMutation.isError && <p className="text-sm text-destructive">{t("saveError")}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t("saving") : t("saveResult")}
          </Button>
          <Button asChild variant="outline">
            <LocalizedLink href="/sessions">{t("backToHistory")}</LocalizedLink>
          </Button>
        </div>
      </form>
    </Card>
  );
}
