"use client";

// Слой views: клиентская граница формы создания сессии. Сессию создаёт только авторизованный
import { CreateSessionForm } from "@/features/create-session";
import type { NewSessionDraft } from "@/entities/session";
import { useGuestRedirect } from "@/shared/api/use-guest-redirect";
import { useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";

/**
 * Пропсы {@link NewSessionFormSection}.
 */
export interface NewSessionFormSectionProps {
  /**
   * Начальные значения черновика для заполнения формы.
   */
  draft: NewSessionDraft;
}

/**
 * Форма создания сессии для вошедшего пользователя. Гостя отправляет на "/auth" и после входа
 * возвращает сюда; пока сессия восстанавливается или идёт редирект - показывает загрузку
 * @param {NewSessionFormSectionProps} props - Пропсы секции.
 * @returns {import('react').ReactNode} Форма или заглушка загрузки.
 */
export function NewSessionFormSection(props: NewSessionFormSectionProps) {
  const common = useTranslations("common");
  const isAuthenticated = useAuthStore((state) => state.status === "authenticated");
  useGuestRedirect();

  if (!isAuthenticated) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  return <CreateSessionForm draft={props.draft} />;
}
