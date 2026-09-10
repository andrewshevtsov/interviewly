// Слой widgets: подвал приложения - общий для всех страниц.
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Приватность", href: "#" },
  { label: "Условия", href: "#" },
  { label: "Telegram-бот", href: "#" },
  { label: "GitHub", href: "#" },
];

/**
 * App footer: brand mark, secondary links and copyright.
 * @returns {import('react').ReactNode} The footer.
 */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <span className="font-bold tracking-tight">Interviewly</span>

        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-muted-foreground">© 2026 INTERVIEWLY TECH PLATFORM</span>
      </div>
    </footer>
  );
}
