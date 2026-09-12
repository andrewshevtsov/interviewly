// Слой views: страница "Новая сессия" - создание и настройка комнаты интервью.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { CreateSessionForm } from "@/features/create-session";
import { getServerTranslations } from "@/shared/i18n-server";
import type { NewSessionDraft } from "@/entities/session";

/**
 * Props for {@link NewSessionPage}.
 */
export interface NewSessionPageProps {
  /**
   * Initial draft values for the creation form.
   */
  draft: NewSessionDraft;
}

/**
 * Renders the "New Session" screen: navbar, the session creation form and the footer.
 * @param {NewSessionPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The new-session page.
 */
export async function NewSessionPage(props: NewSessionPageProps) {
  const t = await getServerTranslations("newSession");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>

        <div className="mt-10">
          <CreateSessionForm draft={props.draft} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
