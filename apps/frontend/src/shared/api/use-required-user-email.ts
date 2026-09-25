"use client";

// Слой shared: email текущего пользователя для UI, который зависит от того, кто смотрит
// (например, мок-история интервью). Email берётся из payload access-токена в auth-store -
// только для отображения, права проверяет backend
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";

const JWT_PAYLOAD_INDEX = 1;

/**
 * Часть payload access-токена, которую читает этот хук.
 */
interface AccessTokenClaims {
  /**
   * Email владельца токена.
   */
  email?: unknown;
}

/**
 * Превращает бинарную строку (как возвращает `atob`) в байты.
 * @param {string} binary - строка, где каждый символ - один байт.
 * @returns {Uint8Array} Байты.
 */
function toBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Читает claim `email` из JWT access-токена без проверки подписи.
 * @param {string} token - JWT access-токен.
 * @returns {string | undefined} Email, либо `undefined`, если его нет в токене.
 */
function readEmail(token: string): string | undefined {
  try {
    const base64 = (token.split(".")[JWT_PAYLOAD_INDEX] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const { email } = JSON.parse(new TextDecoder().decode(toBytes(atob(base64)))) as AccessTokenClaims;

    return typeof email === "string" ? email : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Email текущего пользователя. Пока сессия восстанавливается после загрузки страницы
 * (это делает AuthSessionInit), возвращает `undefined`; если сессии в итоге нет (гость или
 * после выхода), отправляет посетителя на "/auth" и продолжает возвращать `undefined`.
 * @returns {string | undefined} Email текущего пользователя, либо `undefined`, если пока не известен.
 */
export function useRequiredUserEmail(): string | undefined {
  const router = useRouter();
  const locale = useLocale();
  const token = useAuthStore((state) => state.accessToken);
  const isGuest = useAuthStore((state) => state.status === "anonymous");

  useEffect(() => {
    if (isGuest) {
      router.replace(getLocalizedHref("/auth", locale));
    }
  }, [isGuest, router, locale]);

  return token ? readEmail(token) : undefined;
}
