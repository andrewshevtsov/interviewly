"use client";

// Слой widgets: навигация в шапке приложения - общая для всех страниц.
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { LanguageSwitcher } from "@/features/change-language";
import { ThemeToggle } from "@/features/toggle-theme";
import { LogoutButton } from "@/features/logout";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { useAuthStore } from "@/shared/model/auth-store";
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
  { labelKey: "showcase", href: "/showcase" },
  { labelKey: "leaderboard", href: "/leaderboard" },
  { labelKey: "history", href: "/sessions" },
  { labelKey: "profile", href: "/profile" },
];

/**
 * Верхняя навигация: логотип, ссылки разделов (только для залогиненных) и действия входа/CTA.
 * Подсвечивает ссылку, соответствующую текущему роуту.
 * @returns {import('react').ReactNode} Навбар.
 */
export function Navbar() {
  const PATHNAME = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");
  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = authStatus === "authenticated";
  const localizedProfileHref = getLocalizedHref("/profile", locale);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <LocalizedLink href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            I
          </span>
          Interviewly
        </LocalizedLink>

        {isAuthenticated && (
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
        )}

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {authStatus === "initializing"
            ? null
            : isAuthenticated
              ? (
                <>
                  <Button asChild variant="ghost" size="icon" className={cn(PATHNAME === localizedProfileHref && "text-primary")}>
                    <LocalizedLink
                      href="/profile"
                      aria-label={t("profile")}
                      aria-current={PATHNAME === localizedProfileHref ? "page" : undefined}
                    >
                      <CircleUserRound className="h-5 w-5" />
                    </LocalizedLink>
                  </Button>
                  <LogoutButton />
                </>
              )
              : (
                <LocalizedLink href="/auth" className="text-sm text-foreground hover:text-muted-foreground">
                  {t("signIn")}
                </LocalizedLink>
              )}
          {isAuthenticated && (
            <Button asChild size="sm">
              <LocalizedLink href="/sessions/new">{t("createSession")}</LocalizedLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
