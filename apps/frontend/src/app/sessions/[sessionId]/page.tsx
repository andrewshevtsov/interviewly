import { InterviewSessionPage } from "@/views/interview-session-page";
import { DEMO_USER } from "../../demo-data";

/**
 * Props for the dynamic "/sessions/[sessionId]" route.
 */
export interface SessionPageProps {
  /**
   * Next.js dynamic route params, resolved asynchronously.
   */
  params: Promise<{
    /**
     * Session ID captured from the URL segment.
     */
    sessionId: string;
  }>;
}

/**
 * Route "/sessions/[sessionId]" - renders the interview session page for
 * the session ID captured from the URL.
 * @param {SessionPageProps} props - Next.js route props containing the dynamic params.
 * @returns {Promise<import('react').ReactNode>} The interview session page.
 */
export default async function Page(props: SessionPageProps) {
  const params = await props.params;

  return <InterviewSessionPage sessionId={params.sessionId} user={DEMO_USER} />;
}
