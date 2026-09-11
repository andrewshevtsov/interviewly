"use client";

// Слой features: форма регистрации - имя, фамилия, email и пароль.
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { setAccessToken } from "@/shared/api/access-token";
import { authApi } from "@/shared/api/auth-api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/**
 * Registration form: first/last name, email, password and password-confirmation fields.
 * @returns {import('react').ReactNode} The registration form.
 */
export function RegisterForm() {
  const router = useRouter();
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
      router.push("/profile");
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
        <Label htmlFor="register-first-name">Имя</Label>
        <Input
          id="register-first-name"
          type="text"
          placeholder="Артём"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-last-name">Фамилия</Label>
        <Input
          id="register-last-name"
          type="text"
          placeholder="Соколов"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@company.dev"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password-confirm">Повторите пароль</Label>
        <Input
          id="register-password-confirm"
          type="password"
          placeholder="••••••••"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          minLength={8}
          required
        />
      </div>

      {passwordMismatch && <p className="text-sm text-destructive">Пароли не совпадают</p>}
      {registerMutation.isError && (
        <p className="text-sm text-destructive">Не удалось зарегистрироваться. Проверьте данные.</p>
      )}

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Создаём аккаунт…" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
