"use client";

// Слой widgets: шапка экрана прошедшего интервью - название, участники, итоговая оценка и метрики.
// Клиентский компонент, потому что внутри используется useTranslations - хук на React Context.
// Такие хуки работают только в клиентских компонентах, поэтому "use client".
import { ArrowLeft } from "lucide-react";

import { useTranslations } from "@/shared/i18n-context";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { SectionLabel } from "@/shared/ui/section-label";
import type { SessionDetails, SessionParticipantRole } from "@/entities/session";

const PARTNER_ROLES: Record<SessionParticipantRole, SessionParticipantRole> = {
  candidate: "interviewer",
  interviewer: "candidate",
};

/**
 * Пропсы {@link SessionSummaryOverview}.
 */
export interface SessionSummaryOverviewProps {
  /**
   * Прошедшее интервью с точки зрения текущего пользователя.
   */
  details: SessionDetails;
}

/**
 * Шапка экрана прошедшего интервью: ссылка назад, заголовок с датой и длительностью,
 * участники, итоговая оценка и ключевые метрики.
 * @param {SessionSummaryOverviewProps} props - пропсы секции.
 * @returns {import('react').ReactNode} Секция шапки.
 */
export function SessionSummaryOverview(props: SessionSummaryOverviewProps) {
  const { details } = props;
  const t = useTranslations("summary");
  const session = useTranslations("session");

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
          #{details.number}
        </Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{session(details.role)}</span>
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{details.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {details.date} · {details.duration}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <SectionLabel>{t("participantsTitle")}</SectionLabel>
          <ul className="mt-3 space-y-3">
            <li className="flex items-center justify-between gap-2">
              <span className="font-medium">{t("you")}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{session(details.role)}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="font-medium">{details.partnerName}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {session(PARTNER_ROLES[details.role])}
              </span>
            </li>
          </ul>
        </Card>

        <Card className="p-5 text-center">
          <SectionLabel>{t("resultTitle")}</SectionLabel>
          <p className="mt-3 text-5xl font-bold text-primary">{details.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {session("scoreOutOf")} {details.scoreMax}
          </p>
        </Card>

        <Card className="p-5">
          <SectionLabel>{t("metricsTitle")}</SectionLabel>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{t("hintsUsed")}</dt>
              <dd className="font-mono font-medium">
                {details.hintsUsed}/{details.hintsTotal}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{t("codeRuns")}</dt>
              <dd className="font-mono font-medium">{details.codeRuns}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{t("reconnects")}</dt>
              <dd className="font-mono font-medium">{details.reconnects}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </section>
  );
}
