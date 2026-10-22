// Слой views: страница "Открытая сессия" - живой воркспейс интервью.
// Разрешено импортировать widgets, features, entities, shared.
import { getServerTranslations } from "@/shared/i18n-server";
import { prepareInterviewSessionPage } from "./index";
import { LiveSessionGate } from "./LiveSessionGate";

/**
 * Пропсы {@link InterviewSessionPage}.
 */
export interface InterviewSessionPageProps {
  /**
   * ID отображаемой сессии интервью.
   */
  sessionId: string;
}

/**
 * Рендерит экран "Открытая сессия". Битая ссылка отклоняется сразу; всё остальное (заявка,
 * ожидание владельца, живая комната) решается на клиенте.
 * @param {InterviewSessionPageProps} props - Пропсы страницы.
 * @returns {import('react').ReactNode} Страница сессии интервью.
 */
export async function InterviewSessionPage(props: InterviewSessionPageProps) {
  const state = prepareInterviewSessionPage(props.sessionId);

  if (!state.canJoin) {
    const t = await getServerTranslations("interview");

    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">{t("cannotOpenSession")}</p>
      </main>
    );
  }

  return <LiveSessionGate sessionId={props.sessionId} />;
}
