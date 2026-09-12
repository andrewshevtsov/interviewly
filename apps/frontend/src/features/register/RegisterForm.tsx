"use client";

// Слой features: форма регистрации - имя, email, пароль и подтверждение.
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
 * Registration form: name, email, password and password-confirmation fields.
 * @returns {import('react').ReactNode} The registration form.
 */
export function RegisterForm() {
  const common = useTranslations("common");
  const auth = useTranslations("auth");

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="register-name">{auth("fullName")}</Label>
        <Input id="register-name" type="text" placeholder={auth("fullNamePlaceholder")} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{common("email")}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder={auth.raw("emailPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{auth("password")}</Label>
        <Input
          id="register-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password-confirm">{auth("confirmPassword")}</Label>
        <Input
          id="register-password-confirm"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        {auth("register")}
      </Button>
    </form>
  );
}
