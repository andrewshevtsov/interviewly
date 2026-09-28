"use client";

// Слой features: форма регистрации - имя, фамилия, email и пароль.
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { authApi } from "@/shared/api/auth-api";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/**
 * Registration form: first/last name, email, password and password-confirmation fields.
 * @returns {import('react').ReactNode} The registration form.
 */
export function RegisterForm() {
  const router = useRouter();
  const locale = useLocale();
  const common = useTranslations("common");
  const auth = useTranslations("auth");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    /**
     * Stores the new access token and redirects to the profile page.
     * @param {{ accessToken: string }} tokens - The registration response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAuthenticated(tokens.accessToken);
      router.push(getLocalizedHref("/profile", locale));
    },
  });

  /**
   * Validates the password confirmation and submits the registration form.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const { email, password, firstName, lastName, passwordConfirm } = Object.fromEntries(formData) as Record<
    "email" | "password" | "firstName" | "lastName" | "passwordConfirm",
    string>;
    if (password !== passwordConfirm) {
      setPasswordMismatch(true);

      return;
    }
    setPasswordMismatch(false);

    registerMutation.mutate({
      email,
      password,
      firstName,
      lastName: lastName || undefined,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="register-first-name">{auth("firstName")}</Label>
        <Input
          id="register-first-name"
          type="text"
          placeholder={auth.raw("firstNamePlaceholder")}
          name="firstName"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-last-name">{auth("lastName")}</Label>
        <Input
          id="register-last-name"
          type="text"
          placeholder={auth.raw("lastNamePlaceholder")}
          name="LastName"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{common("email")}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder={auth.raw("emailPlaceholder")}
          name="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{auth("password")}</Label>
        <Input
          id="register-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          name="password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password-confirm">{auth("confirmPassword")}</Label>
        <Input
          id="register-password-confirm"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          name="passwordConfirm"
          minLength={8}
          required
        />
      </div>

      {passwordMismatch && <p className="text-sm text-destructive">{auth("passwordMismatch")}</p>}
      {registerMutation.isError && <p className="text-sm text-destructive">{auth("registerError")}</p>}

      <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
        {registerMutation.isPending ? auth("registerPending") : auth("register")}
      </Button>
    </form>
  );
}
