import { SessionsListPage } from "@/views/sessions-list-page";
import { DEMO_SESSIONS } from "../demo-data";

/**
 * Route "/sessions" - lists all demo interview sessions.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export default function Page() {
  return <SessionsListPage sessions={DEMO_SESSIONS} />;
}
