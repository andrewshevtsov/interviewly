"use client";

// Слой features: форма входа - email и пароль.
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
 * Login form: email and password fields.
 * @returns {import('react').ReactNode} The login form.
 */
export function LoginForm() {
  const router = useRouter();
  const locale = useLocale();
  const common = useTranslations("common");
  const auth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    /**
     * Stores the new access token and redirects to the profile page.
     * @param {{ accessToken: string }} tokens - The login response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      router.push(getLocalizedHref("/profile", locale));
    },
  });

  /**
   * Submits the login form.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">{common("email")}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={auth.raw("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{auth("password")}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {loginMutation.isError && <p className="text-sm text-destructive">{auth("loginError")}</p>}

      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? auth("loginPending") : auth("login")}
      </Button>
    </form>
  );
}
