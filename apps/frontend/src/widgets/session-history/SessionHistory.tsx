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

      {entries.length === 0 && <p className="mt-10 text-muted-foreground">{t("historyEmpty")}</p>}

      <div className="mt-10 space-y-4">
        {entries.map((entry) => {
          const meta = [
            entry.partners.map((partner) => partner.name).join(", "),
            entry.date && formatDate(entry.date, locale),
            entry.durationMinutes !== null && `${entry.durationMinutes} ${t.raw("minutesShort")}`,
          ].filter(Boolean);

          return (
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
                      {t(entry.myRole)}
                    </span>
                  </div>

              <p className="mt-2 font-semibold">{entry.title ?? t("untitledSession")}</p>
              <p className="text-sm text-muted-foreground">
                {entry.partnerName} · {dateFormatter.format(new Date(entry.date))} ·{" "}
                {entry.durationMinutes} {t("minutesShort")}
              </p>
            </div>

                <ComingSoon label={t("comingSoon")}>
                  <p className="text-sm text-muted-foreground">
                    {t("hintsUsedLabel")}: {placeholder.hintsUsed}/{placeholder.hintsTotal}
                  </p>
                </ComingSoon>
              </Card>
            </LocalizedLink>
          );
        })}
      </div>
    </section>
  );
}
