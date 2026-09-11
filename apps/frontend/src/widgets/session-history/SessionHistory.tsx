// Слой widgets: секция "История интервью" - прошедшие сессии пользователя с оценками.
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import type { SessionHistoryEntry, SessionParticipantRole } from "@/entities/session";

const ROLE_LABELS: Record<SessionParticipantRole, string> = {
  candidate: "КАНДИДАТ",
  interviewer: "ИНТЕРВЬЮЕР",
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

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">История интервью</h1>
      <p className="mt-2 text-muted-foreground">Ваши сессии, оценки и личные заметки.</p>

      <div className="mt-10 space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="muted" className="rounded-md font-mono text-[10px]">
                  #{entry.number}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {ROLE_LABELS[entry.role]}
                </span>
              </div>

              <p className="mt-2 font-semibold">{entry.title}</p>
              <p className="text-sm text-muted-foreground">
                {entry.partnerName} · {entry.date} · {entry.duration} · подсказок:{" "}
                {entry.hintsUsed}/{entry.hintsTotal}
              </p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{entry.score}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                из {entry.scoreMax}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
