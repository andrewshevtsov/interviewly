// Слой views: страница "История интервью" - прошедшие сессии пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import type { PastSession } from "@/entities/session";
import { SessionHistorySection } from "./SessionHistorySection";

/**
 * Пропсы {@link SessionsListPage}.
 */
export interface SessionsListPageProps {
  /**
   * Мок-интервью - источник значений для размытых блоков
   */
  placeholder: PastSession;
}

/**
 * Экран "История"
 * @param {SessionsListPageProps} props - пропсы страницы.
 * @returns {import('react').ReactNode} Страница истории интервью.
 */
export function SessionsListPage(props: SessionsListPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <SessionHistorySection placeholder={props.placeholder} />
      </main>

      <Footer />
    </div>
  );
}
