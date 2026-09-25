"use client";

// Слой widgets: секция "История интервью" - прошедшие сессии пользователя с оценками.
import { useTranslations } from "@/shared/i18n-context";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import type { SessionHistoryEntry, SessionParticipantRole } from "@/entities/session";

const ROLE_LABEL_KEYS: Record<SessionParticipantRole, "interviewer" | "candidate"> = {
  candidate: "candidate",
  interviewer: "interviewer",
};

/**
 * Props for {@link SessionHistory}.
 */
export interface SessionHistoryProps {
  /**
   * Past sessions to list, most recent first.
   */
  entries: SessionHistoryEntry[];
}

/**
 * "История интервью" section: past sessions with role, participants, hints used and score.
 * @param {SessionHistoryProps} props - Props for the section.
 * @returns {import('react').ReactNode} The session history section.
 */
export function SessionHistory(props: SessionHistoryProps) {
  const { entries } = props;
  const t = useTranslations("session");

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("historyTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("historyDescription")}</p>

      {entries.length === 0 && <p className="mt-10 text-muted-foreground">{t("historyEmpty")}</p>}

      <div className="mt-10 space-y-4">
        {entries.map((entry) => (
          <LocalizedLink
            key={entry.id}
            href={`/sessions/${entry.id}/summary`}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="flex items-center gap-4 p-5 transition-colors hover:border-primary/60">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="muted" className="rounded-md font-mono text-[10px]">
                    #{entry.number}
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {t(ROLE_LABEL_KEYS[entry.role])}
                  </span>
                </div>

                <p className="mt-2 font-semibold">{entry.title}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.partnerName} · {entry.date} · {entry.duration} · {t("hintsUsedLabel")}:{" "}
                  {entry.hintsUsed}/{entry.hintsTotal}
                </p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{entry.score}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("scoreOutOf")} {entry.scoreMax}
                </p>
              </div>
            </Card>
          </LocalizedLink>
        ))}
      </div>
    </section>
  );
}
