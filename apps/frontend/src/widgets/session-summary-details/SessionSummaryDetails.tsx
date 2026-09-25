// Слой widgets: остальные разделы экрана прошедшего интервью - задача, итоговый код,
// AI-подсказки, хронология и AI-резюме
import { getServerTranslations } from "@/shared/i18n-server";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { ComingSoon } from "@/shared/ui/coming-soon";
import { SectionLabel } from "@/shared/ui/section-label";
import type { PastSession } from "@/entities/session";

/**
 * Пропсы {@link SessionSummaryDetails}.
 */
export interface SessionSummaryDetailsProps {
  /**
   * Прошедшее интервью для отображения (одинаковое для всех).
   */
  session: PastSession;
}

/**
 * Задача, итоговый код, AI-подсказки, хронология и AI-резюме прошедшего интервью.
 * @param {SessionSummaryDetailsProps} props - пропсы секции.
 * @returns {import('react').ReactNode} Секции с деталями.
 */
export async function SessionSummaryDetails(props: SessionSummaryDetailsProps) {
  const { session } = props;
  const t = await getServerTranslations("summary");
  const comingSoon = (await getServerTranslations("session"))("comingSoon");

  return (
    <div className="space-y-4">
      <ComingSoon label={comingSoon}>
        <Card className="p-5">
          <SectionLabel>{t("taskTitle")}</SectionLabel>
          <p className="mt-3 font-semibold">{session.taskTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{session.taskDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.topics.map((topic) => (
              <Badge key={topic} variant="muted">
                {topic}
              </Badge>
            ))}
          </div>
        </Card>
      </ComingSoon>

      <ComingSoon label={comingSoon}>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>{t("codeTitle")}</SectionLabel>
            <Badge variant="outline" className="rounded-md font-mono text-[10px]">
              {session.codeLanguage}
            </Badge>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-sm">
            <code>{session.finalCode}</code>
          </pre>
        </Card>
      </ComingSoon>

      <ComingSoon label={comingSoon}>
        <Card className="p-5">
          <SectionLabel>{t("hintsTitle")}</SectionLabel>
          {session.hints.length === 0
            ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("hintsEmpty")}</p>
            )
            : (
              <ol className="mt-3 space-y-3">
                {session.hints.map((hint) => (
                  <li key={hint.at} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-primary">{hint.at}</span>
                    <span>{hint.text}</span>
                  </li>
                ))}
              </ol>
            )}
        </Card>
      </ComingSoon>

      <ComingSoon label={comingSoon}>
        <Card className="p-5">
          <SectionLabel>{t("timelineTitle")}</SectionLabel>
          <ul className="mt-3 space-y-2">
            {session.timeline.map((event) => (
              <li key={event.at} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{event.at}</span>
                <span>{event.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </ComingSoon>

      <ComingSoon label={comingSoon}>
        <Card className="p-5">
          <SectionLabel>{t("aiSummaryTitle")}</SectionLabel>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">{t("strengthsTitle")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {session.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">{t("growthAreasTitle")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {session.growthAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </ComingSoon>
    </div>
  );
}
