import { SessionsListPage } from "@/views/sessions-list-page";
import { DEMO_SESSIONS } from "@/app/demo-data";

/**
 * Localized route that lists all demo interview sessions.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export default function Page() {
  return <SessionsListPage sessions={DEMO_SESSIONS} />;
}
