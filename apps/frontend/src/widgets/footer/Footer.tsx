// Слой widgets: подвал приложения - общий для всех страниц.
import { getServerTranslations } from "@/shared/i18n-server";
import { LocalizedLink } from "@/shared/ui/localized-link";

const FOOTER_LINKS = [
  { labelKey: "privacy", href: "#" },
  { labelKey: "terms", href: "#" },
  { labelKey: "telegramBot", href: "#" },
] as const;

/**
 * App footer: brand mark, secondary links and copyright.
 * @returns {import('react').ReactNode} The footer.
 */
export async function Footer() {
  const t = await getServerTranslations("footer");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <span className="font-bold tracking-tight">Interviewly</span>

        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <LocalizedLink key={link.labelKey} href={link.href} className="hover:text-foreground">
              {t(link.labelKey)}
            </LocalizedLink>
          ))}
          <LocalizedLink href="#" className="hover:text-foreground">
            GitHub
          </LocalizedLink>
        </nav>

        <span className="text-xs uppercase text-muted-foreground">© 2026 {t("copyright")}</span>
      </div>
    </footer>
  );
}
