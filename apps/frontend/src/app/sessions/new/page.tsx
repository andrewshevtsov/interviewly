import { NewSessionPage } from "@/views/new-session-page";
import { DEMO_NEW_SESSION_DRAFT } from "../../demo-data";

/**
 * Route "/sessions/new" - the session creation form, prefilled with demo values.
 * @returns {import('react').ReactNode} The new-session page.
 */
export default function Page() {
  return <NewSessionPage draft={DEMO_NEW_SESSION_DRAFT} />;
}
