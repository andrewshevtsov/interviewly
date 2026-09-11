import { SessionFeedbackPage } from "@/views/session-feedback-page";
import { DEMO_SESSION_HISTORY } from "../../../demo-data";

const DEMO_SESSION = DEMO_SESSION_HISTORY[0];

/**
 * Route "/sessions/[sessionId]/feedback" - the post-session feedback form.
 * @returns {import('react').ReactNode} The session feedback page.
 */
export default function Page() {
  return (
    <SessionFeedbackPage
      sessionNumber={DEMO_SESSION?.number ?? ""}
      defaultScore={DEMO_SESSION?.score ?? 0}
    />
  );
}
