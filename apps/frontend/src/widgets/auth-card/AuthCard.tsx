"use client";

// Слой widgets: карточка входа/регистрации - переключатель вкладок и текущая форма.
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
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
  labelKey: "loginTab" | "registerTab";
}

const TABS: TabOption[] = [
  { id: "login", labelKey: "loginTab" },
  { id: "register", labelKey: "registerTab" },
];

/**
 * Auth card: a login/registration tab toggle, the active form, a "continue with Telegram"
 * button and the terms-of-service notice.
 * @returns {import('react').ReactNode} The auth card.
 */
export function AuthCard() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const t = useTranslations("auth");

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
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-6">{activeTab === "login" ? <LoginForm /> : <RegisterForm />}</div>

      <div className="mt-6 flex items-center gap-4 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="mt-6 w-full">
        {t("continueWithTelegram")}
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("agreementPrefix")}{" "}
        <LocalizedLink href="#" className="text-primary hover:underline">
          {t("termsOfService")}
        </LocalizedLink>
        .
      </p>
    </Card>
  );
}
