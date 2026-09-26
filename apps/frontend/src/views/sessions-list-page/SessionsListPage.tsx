// Слой views: страница "История интервью" - прошедшие сессии пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { SessionHistory } from "@/widgets/session-history";

/**
 * Renders the "История" screen: navbar, the session history section and the footer.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export function SessionsListPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <SessionHistory />
      </main>

      <Footer />
    </div>
  );
}
