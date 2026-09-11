"use client";

// Слой features: форма входа - email и пароль.
import type { SubmitEvent } from "react";

import { Button } from "@/shared/ui/button";
import { useTranslations } from "@/shared/i18n-context";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/**
 * Prevents the default full-page submit for this demo form (no backend wired up yet).
 * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
 * @returns {void}
 */
function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
  event.preventDefault();
}

/**
 * Login form: email and password fields.
 * @returns {import('react').ReactNode} The login form.
 */
export function LoginForm() {
  const common = useTranslations("common");
  const auth = useTranslations("auth");

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">{common("email")}</Label>
        <Input id="login-email" type="email" placeholder={auth("emailPlaceholder")} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{auth("password")}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        {auth("login")}
      </Button>
    </form>
  );
}
