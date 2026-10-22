// Слой views: страница "Отклики" - входящие и исходящие.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { ShowcaseResponses } from "@/widgets/showcase-responses";
import { getServerTranslations } from "@/shared/i18n-server";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

/**
 * Рендерит экран "Отклики": navbar, входящие/исходящие отклики и footer.
 * @returns {import('react').ReactNode} страница откликов.
 */
export async function ShowcaseResponsesPage() {
  const t = await getServerTranslations("showcaseResponses");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("pageDescription")}</p>
          </div>

          <Button asChild variant="outline">
            <LocalizedLink href="/showcase">{t("backToShowcase")}</LocalizedLink>
          </Button>
        </div>

        <div className="mt-10">
          <ShowcaseResponses />
        </div>
      </main>

      <Footer />
    </div>
  );
}
