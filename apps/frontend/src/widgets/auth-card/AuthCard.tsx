"use client";

// Слой widgets: карточка входа/регистрации - переключатель вкладок и текущая форма.
import { useState } from "react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LoginForm } from "@/features/login";
import { RegisterForm } from "@/features/register";

/**
 * Which form the auth card currently shows.
 */
type AuthTab = "login" | "register";

/**
 * A single tab in the auth card's login/registration toggle.
 */
interface TabOption {
  /**
   * Tab identifier.
   */
  id: AuthTab;

  /**
   * Tab label.
   */
  label: string;
}

const TABS: TabOption[] = [
  { id: "login", label: "Вход" },
  { id: "register", label: "Регистрация" },
];

/**
 * Auth card: a login/registration tab toggle, the active form, a "continue with Telegram"
 * button and the terms-of-service notice.
 * @returns {import('react').ReactNode} The auth card.
 */
export function AuthCard() {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- useState pair, not a real constant
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  return (
    <Card className="w-full max-w-md p-8">
      <div className="flex rounded-md bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{activeTab === "login" ? <LoginForm /> : <RegisterForm />}</div>

      <div className="mt-6 flex items-center gap-4 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Или
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="mt-6 w-full">
        Продолжить через Telegram
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Продолжая, вы соглашаетесь с{" "}
        <Link href="#" className="text-primary hover:underline">
          условиями сервиса
        </Link>
        .
      </p>
    </Card>
  );
}
