import { SessionFeedbackPage } from "@/views/session-feedback-page";
import { DEMO_SESSION_HISTORY } from "@/app/demo-data";

const DEMO_SESSION = DEMO_SESSION_HISTORY[0];

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

  return (
    <SessionFeedbackPage
      sessionId={sessionId}
      sessionNumber={DEMO_SESSION?.number ?? ""}
      defaultScore={DEMO_SESSION?.score ?? 0}
    />
  );
}
