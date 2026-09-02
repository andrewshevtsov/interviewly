"use client";

// Слой widgets: навигация в шапке приложения - общая для всех страниц.
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

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
  { label: "Кабинет", href: "/profile" },
];

/**
 * Top navigation bar: brand mark, section links and auth/CTA actions. Highlights the link
 * that matches the current route.
 * @returns {import('react').ReactNode} The navbar.
 */
export function Navbar() {
  const PATHNAME = usePathname();

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
          <Link href="/auth" className="text-sm text-foreground hover:text-muted-foreground">
            Войти
          </Link>
          <Button asChild size="sm">
            <Link href="/sessions">Создать сессию</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
