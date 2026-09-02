// Слой features: форма регистрации - имя, email, пароль и подтверждение.
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
 * Registration form: name, email, password and password-confirmation fields.
 * @returns {import('react').ReactNode} The registration form.
 */
export function RegisterForm() {
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="register-name">Имя и фамилия</Label>
        <Input id="register-name" type="text" placeholder="Артём Соколов" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" type="email" placeholder="you@company.dev" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <Input id="register-password" type="password" placeholder="••••••••" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password-confirm">Повторите пароль</Label>
        <Input id="register-password-confirm" type="password" placeholder="••••••••" required />
      </div>

      <Button type="submit" className="w-full">
        Создать аккаунт
      </Button>
    </form>
  );
}
