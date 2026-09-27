// Слой views: экран прошедшего интервью - вся информация о нём, включая отзыв пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { SessionSummaryDetails } from "@/widgets/session-summary-details";
import type { PastSession } from "@/entities/session";
import { SessionSummaryViewer } from "./SessionSummaryViewer";

/**
 * Пропсы {@link SessionSummaryPage}.
 */
export interface SessionSummaryPageProps {
  /**
   * Прошедшее интервью для отображения.
   */
  session: PastSession;
}

/**
 * Рендерит экран прошедшего интервью: навбар, содержимое с точки зрения текущего
 * пользователя (шапка, его отзыв, остальные детали) и футер.
 * @param {SessionSummaryPageProps} props - пропсы страницы.
 * @returns {import('react').ReactNode} Экран прошедшего интервью.
 */
export function SessionSummaryPage(props: SessionSummaryPageProps) {
  const { session } = props;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <SessionSummaryViewer session={session}>
          <SessionSummaryDetails session={session} />
        </SessionSummaryViewer>
      </main>

      <Footer />
    </div>
  );
}
