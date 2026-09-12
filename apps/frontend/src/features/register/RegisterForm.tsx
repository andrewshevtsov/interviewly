"use client";

// Слой features: форма регистрации - имя, фамилия, email и пароль.
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { setAccessToken } from "@/shared/api/access-token";
import { authApi } from "@/shared/api/auth-api";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    /**
     * Stores the new access token and redirects to the profile page.
     * @param {{ accessToken: string }} tokens - The registration response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
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
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-last-name">{auth("lastName")}</Label>
        <Input
          id="register-last-name"
          type="text"
          placeholder={auth.raw("lastNamePlaceholder")}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{common("email")}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder={auth.raw("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{auth("password")}</Label>
        <Input
          id="register-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          minLength={8}
          required
        />
      </div>

      {passwordMismatch && <p className="text-sm text-destructive">{auth("passwordMismatch")}</p>}
      {registerMutation.isError && <p className="text-sm text-destructive">{auth("registerError")}</p>}

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? auth("registerPending") : auth("register")}
      </Button>
    </form>
  );
}
