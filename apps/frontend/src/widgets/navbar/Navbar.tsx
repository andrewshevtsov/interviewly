"use client";

// Слой widgets: навигация в шапке приложения - общая для всех страниц.
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/features/toggle-theme";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { LocalizedLink } from "@/shared/ui/localized-link";

/**
 * A single top navigation link.
 */
interface NavLink {
  /**
   * Link label shown in the navbar.
   */
  labelKey: "showcase" | "leaderboard" | "history" | "profile";

  /**
   * Target href.
   */
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { labelKey: "showcase", href: "/#showcase" },
  { labelKey: "leaderboard", href: "/#leaderboard" },
  { labelKey: "history", href: "/sessions" },
  { labelKey: "profile", href: "/profile" },
];

/**
 * Top navigation bar: brand mark, section links and auth/CTA actions. Highlights the link
 * that matches the current route.
 * @returns {import('react').ReactNode} The navbar.
 */
export function Navbar() {
  const PATHNAME = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <LocalizedLink href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            I
          </span>
          Interviewly
        </LocalizedLink>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <LocalizedLink
              key={link.labelKey}
              href={link.href}
              className={cn(
                "hover:text-foreground",
                PATHNAME === getLocalizedHref(link.href, locale) && "text-primary",
              )}
            >
              {t(link.labelKey)}
            </LocalizedLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LocalizedLink
            href="/auth"
            className="text-sm text-foreground hover:text-muted-foreground"
          >
            {t("signIn")}
          </LocalizedLink>
          <Button asChild size="sm">
            <LocalizedLink href="/sessions">{t("createSession")}</LocalizedLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
