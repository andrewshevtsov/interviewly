// Слой views: страница "История интервью" - прошедшие сессии пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { SessionHistory } from "@/widgets/session-history";
import type { SessionHistoryEntry } from "@/entities/session";

/**
 * Props for {@link SessionsListPage}.
 */
export interface SessionsListPageProps {
  /**
   * Past sessions to list, most recent first.
   */
  entries: SessionHistoryEntry[];
}

/**
 * Renders the "История" screen: navbar, the session history section and the footer.
 * @param {SessionsListPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export function SessionsListPage(props: SessionsListPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <SessionHistory entries={props.entries} />
      </main>

      <Footer />
    </div>
  );
}
