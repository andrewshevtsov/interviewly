"use client";

// Слой features: форма входа - email, пароль и «запомнить меня».
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/shared/api/auth-api";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { SubmitEvent } from "react";

/**
 * Пропсы {@link LoginForm}
 */
export interface LoginFormProps {
  /**
   * Куда вернуть пользователя после входа
   */
  returnPath?: string;
}

/**
 * Login form: email, password and "remember me" fields.
 * @param {LoginFormProps} props - Пропсы компонента
 * @returns {import('react').ReactNode} The login form.
 */
export function LoginForm(props: LoginFormProps) {
  const { returnPath } = props;
  const router = useRouter();
  const locale = useLocale();
  const common = useTranslations("common");
  const auth = useTranslations("auth");
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    /**
     * Stores the new access token and redirects back to `returnPath` or to the profile page.
     * @param {{ accessToken: string }} tokens - The login response.
     * @returns {void}
     */
    onSuccess: (tokens) => {
      setAuthenticated(tokens.accessToken);
      router.push(getLocalizedHref(returnPath ?? "/profile", locale));
    },
  });

  /**
   * Submits the login form.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const { email, password } = Object.fromEntries(formData) as Record<
    "email" | "password", string>;
    const rememberMe = formData.has("rememberMe");
    loginMutation.mutate({ email, password, rememberMe });
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">{common("email")}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={auth.raw("emailPlaceholder")}
          name="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{auth("password")}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder={auth("passwordPlaceholder")}
          name="password"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="login-remember-me" name="rememberMe" />
        <Label htmlFor="login-remember-me">{auth("rememberMe")}</Label>
      </div>

      {loginMutation.isError && <p className="text-sm text-destructive">{auth("loginError")}</p>}

      <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
        {loginMutation.isPending ? auth("loginPending") : auth("login")}
      </Button>
    </form>
  );
}
