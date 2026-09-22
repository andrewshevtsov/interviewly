import { SessionFeedbackPage } from "@/views/session-feedback-page";
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
 * Route "/sessions/[sessionId]/feedback" - the post-session feedback form.
 * @param {FeedbackPageProps} props - Route props.
 * @returns {import('react').ReactNode} The session feedback page.
 */
export default async function Page(props: FeedbackPageProps) {
  const { sessionId } = await props.params;
  // Для неизвестного демо-ID (например, у живой комнаты) берём первую мок-сессию.
  const demoSession = DEMO_PAST_SESSIONS.find((entry) => entry.id === sessionId) ?? DEMO_PAST_SESSIONS[0];

  return (
    <SessionFeedbackPage
      sessionId={sessionId}
      sessionNumber={demoSession?.number ?? ""}
      defaultScore={demoSession?.score ?? 0}
    />
  );
}
