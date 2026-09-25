import { SessionFeedbackPage } from "@/views/session-feedback-page";
import { formatSessionNumber } from "@/entities/session";
import { DEMO_PAST_SESSIONS } from "@/app/demo-session-details";

/**
 * Props for the "/sessions/[sessionId]/feedback" route.
 */
export interface FeedbackPageProps {
  /**
   * Route params, resolved asynchronously per the App Router convention.
   */
  params: Promise<{
    /**
     * Session ID captured from the URL segment.
     */
    sessionId: string;
    /** Locale captured from the parent URL segment. */
    locale: string;
  }>;
}

/**
 * Роут "/sessions/[sessionId]/feedback" форма отзыва после сессии. Для мок-интервью
 * номер и оценка берутся из демо-данных, для реальной сессии короткий код из её UUID
 * @param {FeedbackPageProps} props - Route props.
 * @returns {import('react').ReactNode} The session feedback page.
 */
export default async function Page(props: FeedbackPageProps) {
  const { sessionId } = await props.params;
  const demoSession = DEMO_PAST_SESSIONS.find((entry) => entry.id === sessionId);

  return (
    <SessionFeedbackPage
      sessionId={sessionId}
      sessionNumber={demoSession?.number ?? formatSessionNumber(sessionId)}
      defaultScore={demoSession?.score ?? 0}
    />
  );
}
