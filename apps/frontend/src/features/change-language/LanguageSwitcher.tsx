"use client";

import { Check, Globe } from "lucide-react";

import type { Locale } from "@/shared/i18n";
import { useChangeLocale, useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/** A language available from the navigation menu. */
interface LanguageOption {
  /** Locale written to the URL and locale cookie. */
  locale: Locale;
  /** Language name written in that language. */
  label: string;
  /** Flag displayed next to the language name. */
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { locale: "ru", label: "Русский", flag: "🇷🇺" },
  { locale: "en", label: "English", flag: "🇬🇧" },
];

/**
 * Opens a menu for changing the application locale while preserving the current route.
 * @returns {import("react").ReactNode} Language menu trigger and content.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  const t = useTranslations("navigation");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t("chooseLanguage")}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" aria-label={t("chooseLanguage")}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.locale === locale;

          return (
            <DropdownMenuItem
              key={option.locale}
              className={cn("min-w-36", isActive && "text-primary")}
              aria-current={isActive ? "true" : undefined}
              onSelect={() => {
                if (!isActive) {
                  changeLocale(option.locale);
                }
              }}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {option.flag}
              </span>
              <span>{option.label}</span>
              {isActive && <Check className="ml-auto" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
