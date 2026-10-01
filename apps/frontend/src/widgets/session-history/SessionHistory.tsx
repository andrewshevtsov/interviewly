"use client";

// Слой widgets: секция "История интервью" - завершённые сессии пользователя из данных бэкенда
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { formatDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { ComingSoon } from "@/shared/ui/coming-soon";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { SESSION_TYPE_LABEL_KEYS, type CompletedSession, type PastSession } from "@/entities/session";

/**
 * Пропсы {@link SessionHistory}.
 */
export interface SessionHistoryProps {
  /**
   * Завершённые сессии пользователя, сначала последние
   */
  entries: CompletedSession[];

  /**
   * Мок-интервью - источник значений для размытых подсказок
   */
  placeholder: PastSession;
}

/**
 * Секция "История интервью": заголовок и карточки завершённых сессий со ссылками на их экраны
 * @param {SessionHistoryProps} props - пропсы секции
 * @returns {import('react').ReactNode} История интервью
 */
export function SessionHistory(props: SessionHistoryProps) {
  const { entries, placeholder } = props;
  const locale = useLocale();
  const t = useTranslations("session");

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

                  <p className="mt-2 font-semibold">{t(SESSION_TYPE_LABEL_KEYS[entry.type])}</p>
                  <p className="text-sm text-muted-foreground">{meta.join(" · ")}</p>
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
