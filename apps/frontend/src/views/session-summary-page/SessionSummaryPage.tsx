// Слой views: экран прошедшего интервью - то, что есть в данных бэкенда
// Разрешено импортировать widgets, features, entities, shared
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
   * UUID прошедшего интервью.
   */
  sessionId: string;

  /**
   * Мок-интервью - источник значений для размытых секций.
   */
  placeholder: PastSession;
}

/**
 * Рендерит экран прошедшего интервью: навбар, данные интервью с точки зрения текущего
 * пользователя, его отзыв, размытые мок-секции и футер.
 * @param {SessionSummaryPageProps} props - пропсы страницы.
 * @returns {import('react').ReactNode} Экран прошедшего интервью.
 */
export function SessionSummaryPage(props: SessionSummaryPageProps) {
  const { sessionId, placeholder } = props;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <SessionSummaryViewer sessionId={sessionId} placeholder={placeholder}>
          <SessionSummaryDetails session={placeholder} />
        </SessionSummaryViewer>
      </main>

      <Footer />
    </div>
  );
}
