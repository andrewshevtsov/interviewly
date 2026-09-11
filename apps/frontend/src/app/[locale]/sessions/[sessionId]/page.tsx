import { InterviewSessionPage } from "@/views/interview-session-page";
import { DEMO_USER } from "@/app/demo-data";

/**
 * Props for the localized dynamic session route.
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
    /** Locale captured from the parent URL segment. */
    locale: string;
  }>;
}

/**
 * Localized route that renders the interview session page.
 * @param {SessionPageProps} props - Next.js route props containing the dynamic params.
 * @returns {Promise<import('react').ReactNode>} The interview session page.
 */
export default async function Page(props: SessionPageProps) {
  const params = await props.params;

  return <InterviewSessionPage sessionId={params.sessionId} user={DEMO_USER} />;
}
