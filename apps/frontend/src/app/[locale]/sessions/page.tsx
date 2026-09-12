import { SessionsListPage } from "@/views/sessions-list-page";
import { DEMO_SESSION_HISTORY } from "@/app/demo-data";

/**
 * Route "/sessions" - renders the "History" screen with demo session history.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export default function Page() {
  return <SessionsListPage entries={DEMO_SESSION_HISTORY} />;
}
