// Слой views: страница "Витрина участников" - поиск партнёра для пробного интервью.
// Разрешено импортировать widgets, features, entities, shared.
import Link from "next/link";

import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { ParticipantBrowser } from "@/features/browse-participants";
import { Button } from "@/shared/ui/button";
import type { Participant } from "@/entities/participant";

/**
 * Props for {@link ShowcasePage}.
 */
export interface ShowcasePageProps {
  /**
   * All participants to show and filter.
   */
  participants: Participant[];
}

/**
 * Renders the "Витрина участников" screen: navbar, the search/filter browser and the footer.
 * @param {ShowcasePageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The showcase page.
 */
export function ShowcasePage(props: ShowcasePageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Витрина участников</h1>
            <p className="mt-2 text-muted-foreground">
              Создайте свою карточку или откликнитесь на чужую — сессия создастся автоматически.
            </p>
          </div>

          <Button asChild>
            <Link href="/profile">Моя карточка</Link>
          </Button>
        </div>

        <div className="mt-10">
          <ParticipantBrowser participants={props.participants} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
