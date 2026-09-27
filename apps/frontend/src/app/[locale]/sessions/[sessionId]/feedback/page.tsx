import { SessionFeedbackPage } from "@/views/session-feedback-page";
import { formatSessionNumber } from "@/entities/session";

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
 * Роут "/sessions/[sessionId]/feedback" форма отзыва после сессии
 * @param {FeedbackPageProps} props - Route props
 * @returns {import('react').ReactNode} The session feedback page
 */
export default async function Page(props: FeedbackPageProps) {
  const { sessionId } = await props.params;

  return <SessionFeedbackPage
    sessionId={sessionId}
    sessionNumber={formatSessionNumber(sessionId)}
    defaultScore={0}
  />;
}
