"use client";

// Слой widgets: шапка экрана прошедшего интервью - тип, дата, длительность и участники из данных бэкенда
// Клиентский компонент, потому что внутри используется useTranslations - хук на React Context
import { ArrowLeft } from "lucide-react";

import { useLocale, useTranslations } from "@/shared/i18n-context";
import { formatDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ComingSoon } from "@/shared/ui/coming-soon";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { SectionLabel } from "@/shared/ui/section-label";
import { SESSION_TYPE_LABEL_KEYS, type CompletedSession, type PastSession } from "@/entities/session";

/**
 * Пропсы {@link SessionSummaryOverview}.
 */
export interface SessionSummaryOverviewProps {
  /**
   * Интервью с точки зрения текущего пользователя
   */
  session: CompletedSession;

  /**
   * Мок-интервью - источник значений для размытых метрик
   */
  placeholder: PastSession;
}

/**
 * Шапка экрана прошедшего интервью: ссылка назад, номер, роль, тип, дата и длительность,
 * карточка участников и размытая карточка метрик
 * @param {SessionSummaryOverviewProps} props - пропсы шапки
 * @returns {import('react').ReactNode} Шапка интервью
 */
export function SessionSummaryOverview(props: SessionSummaryOverviewProps) {
  const { session, placeholder } = props;
  const locale = useLocale();
  const t = useTranslations("summary");
  const common = useTranslations("session");
  const meta = [
    session.date && formatDate(session.date, locale),
    session.durationMinutes !== null && `${session.durationMinutes} ${common.raw("minutesShort")}`,
  ].filter(Boolean);

  return (
    <section>
      <Button asChild variant="outline" size="sm">
        <LocalizedLink href="/sessions">
          <ArrowLeft className="h-4 w-4" />
          {t("backToHistory")}
        </LocalizedLink>
      </Button>

      <div className="mt-8 flex items-center gap-2">
        <Badge variant="muted" className="rounded-md font-mono text-[10px]">
          #{session.number}
        </Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{common(session.myRole)}</span>
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{common(SESSION_TYPE_LABEL_KEYS[session.type])}</h1>
      {meta.length > 0 && <p className="mt-2 text-muted-foreground">{meta.join(" · ")}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <SectionLabel>{t("participantsTitle")}</SectionLabel>
          <ul className="mt-3 space-y-3">
            <li className="flex items-center justify-between gap-2">
              <span className="font-medium">{t("you")}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{common(session.myRole)}</span>
            </li>
            {session.partners.map((partner) => (
              <li key={partner.userId} className="flex items-center justify-between gap-2">
                <span className="font-medium">{partner.name}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{common(partner.role)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <ComingSoon label={common("comingSoon")}>
          <Card className="h-full p-5">
            <SectionLabel>{t("metricsTitle")}</SectionLabel>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("hintsUsed")}</dt>
                <dd className="font-mono font-medium">
                  {placeholder.hintsUsed}/{placeholder.hintsTotal}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("codeRuns")}</dt>
                <dd className="font-mono font-medium">{placeholder.codeRuns}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("reconnects")}</dt>
                <dd className="font-mono font-medium">{placeholder.participants[0]?.reconnects ?? 0}</dd>
              </div>
            </dl>
          </Card>
        </ComingSoon>
      </div>
    </section>
  );
}
