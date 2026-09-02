// Слой features: форма входа - email и пароль.
import type { SubmitEvent } from "react";

import { Button } from "@/shared/ui/button";
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
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" placeholder="you@company.dev" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Пароль</Label>
        <Input id="login-password" type="password" placeholder="••••••••" required />
      </div>

      <Button type="submit" className="w-full">
        Войти
      </Button>
    </form>
  );
}
