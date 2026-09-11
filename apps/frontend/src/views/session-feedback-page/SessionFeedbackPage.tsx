// Слой views: страница "Обратная связь" - фидбек по завершённой сессии.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { SessionFeedbackForm } from "@/features/submit-feedback";

/**
 * Props for {@link SessionFeedbackPage}.
 */
export interface SessionFeedbackPageProps {
  /**
   * Short display code for the session, e.g. "4092" (shown as "#4092").
   */
  sessionNumber: string;

  /**
   * Score selected by default when the form is first shown.
   */
  defaultScore: number;
}

/**
 * Renders the "Обратная связь" screen: navbar, the feedback form and the footer.
 * @param {SessionFeedbackPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The session feedback page.
 */
export function SessionFeedbackPage(props: SessionFeedbackPageProps) {
  const { sessionNumber, defaultScore } = props;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Обратная связь</h1>
        <p className="mt-2 text-muted-foreground">
          Сессия #{sessionNumber} завершена. Заметки видны только вам.
        </p>

        <div className="mt-10">
          <SessionFeedbackForm defaultScore={defaultScore} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
