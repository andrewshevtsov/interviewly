"use client";

// Слой features: форма обратной связи по завершённой сессии - оценка и заметки.
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { Textarea } from "@/shared/ui/textarea";
import { MAX_SESSION_SCORE } from "@/shared/config/constants";

const INCLUSIVE_RANGE_OFFSET = 1;
const SCORE_OPTIONS = Array.from(
  { length: MAX_SESSION_SCORE + INCLUSIVE_RANGE_OFFSET },
  (unusedEntry, score) => score,
);
const SAVE_REDIRECT_DELAY_MS = 600;

/**
 * Props for {@link SessionFeedbackForm}.
 */
export interface SessionFeedbackFormProps {
  /**
   * Score selected by default when the form is first shown.
   */
  defaultScore: number;
}

/**
 * Session feedback form: a 0-10 score picker and three free-form notes fields. Saving redirects
 * to "История" (no backend wired up yet).
 * @param {SessionFeedbackFormProps} props - Props for the form.
 * @returns {import('react').ReactNode} The session feedback form.
 */
export function SessionFeedbackForm(props: SessionFeedbackFormProps) {
  const { defaultScore } = props;
  const router = useRouter();
  const locale = useLocale();
  const [score, setScore] = useState(defaultScore);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations("feedback");

  /**
   * Simulates saving the feedback, then returns to "История".
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    setIsSaving(true);
    setTimeout(() => router.push(getLocalizedHref("/sessions", locale)), SAVE_REDIRECT_DELAY_MS);
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          <Label htmlFor="feedback-strengths">{t("strengthsLabel")}</Label>
          <Textarea id="feedback-strengths" placeholder={t("strengthsPlaceholder")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-growth-areas">{t("growthAreasLabel")}</Label>
          <Textarea id="feedback-growth-areas" placeholder={t("growthAreasPlaceholder")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-notes">{t("notesLabel")}</Label>
          <Textarea id="feedback-notes" placeholder={t("notesPlaceholder")} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("saving") : t("saveResult")}
          </Button>
          <Button asChild variant="outline">
            <LocalizedLink href="/sessions">{t("backToHistory")}</LocalizedLink>
          </Button>
        </div>
      </form>
    </Card>
  );
}
