"use client";

// Слой widgets: секция "История интервью" - прошедшие сессии пользователя с оценками.
import { useQuery } from "@tanstack/react-query";

import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { sessionApi, type SessionParticipantRole } from "@/entities/session";

const ROLE_LABEL_KEYS: Record<SessionParticipantRole, "interviewer" | "candidate"> = {
  candidate: "candidate",
  interviewer: "interviewer",
};

const LOCALE_TAGS: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
};

/**
 * "История интервью" section: past sessions with role, participants and score.
 * @returns {import('react').ReactNode} The session history section.
 */
export function SessionHistory() {
  const t = useTranslations("session");
  const common = useTranslations("common");
  const locale = useLocale();

  const historyQuery = useQuery({
    queryKey: ["sessions", "history"],
    queryFn: sessionApi.getHistory,
  });

  if (historyQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  const entries = historyQuery.data ?? [];
  const dateFormatter = new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? locale, { dateStyle: "long" });

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("historyTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("historyDescription")}</p>

      <div className="mt-10 space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="muted" className="rounded-md font-mono text-[10px]">
                  #{entry.number}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t(ROLE_LABEL_KEYS[entry.role])}
                </span>
              </div>

              <p className="mt-2 font-semibold">{entry.title ?? t("untitledSession")}</p>
              <p className="text-sm text-muted-foreground">
                {entry.partnerName} · {dateFormatter.format(new Date(entry.date))} ·{" "}
                {entry.durationMinutes} {t("minutesShort")}
              </p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{entry.score}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("scoreOutOf")} {entry.scoreMax}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
