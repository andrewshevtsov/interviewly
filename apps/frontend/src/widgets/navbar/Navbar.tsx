"use client";

// Слой widgets: навигация в шапке приложения - общая для всех страниц.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { ThemeToggle } from "@/features/toggle-theme";
import { LogoutButton } from "@/features/logout";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { useIsAuthenticated } from "@/shared/api/use-is-authenticated";

/**
 * A single top navigation link.
 */
interface NavLink {
  /**
   * Link label shown in the navbar.
   */
  label: string;

  /**
   * Target href.
   */
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Витрина", href: "/#showcase" },
  { label: "Лидерборд", href: "/#leaderboard" },
  { label: "История", href: "/sessions" },
];

/**
 * Top navigation bar: brand mark, section links and auth/CTA actions. Highlights the link
 * that matches the current route.
 * @returns {import('react').ReactNode} The navbar.
 */
export function Navbar() {
  const PATHNAME = usePathname();
  const isAuthenticated = useIsAuthenticated();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            I
          </span>
          Interviewly
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn("hover:text-foreground", PATHNAME === link.href && "text-primary")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated
            ? (
              <>
                <Button asChild variant="ghost" size="icon" className={cn(PATHNAME === "/profile" && "text-primary")}>
                  <Link href="/profile" aria-label="Личный кабинет" aria-current={PATHNAME === "/profile" ? "page" : undefined}>
                    <CircleUserRound className="h-5 w-5" />
                  </Link>
                </Button>
                <LogoutButton />
              </>
            )
            : (
              <Button asChild size="sm" >
                <Link href="/auth" className="text-sm text-foreground">
                  Войти
                </Link>
              </Button>
            )}
          {isAuthenticated && (
            <Button asChild size="sm">
              <Link href="/sessions">Создать сессию</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
