"use client";

// Слой features: форма создания сессии - название, язык редактора и приватность.
// Отправляет реальный POST /sessions; название и язык бэкенд пока не хранит.
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { sessionApi, type ApiSession, type EditorLanguage, type NewSessionDraft } from "@/entities/session";

/**
 * Один вариант в группе переключателей "Язык редактора".
 */
interface LanguageOption {
  /**
   * Идентификатор языка.
   */
  id: EditorLanguage;

  /**
   * Подпись языка, выводится моноширинным шрифтом.
   */
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: "python", label: "python" },
  { id: "javascript", label: "javascript" },
];

// Совпадает с @MinLength в CreateSessionDto на бэкенде.
const MIN_PASSWORD_LENGTH = 4;

/**
 * Пропсы {@link CreateSessionForm}.
 */
export interface CreateSessionFormProps {
  /**
   * Начальные значения черновика для заполнения формы.
   */
  draft: NewSessionDraft;
}

/**
 * Форма создания сессии: название, язык редактора и переключатель приватности с паролем.
 * Запуск создаёт сессию на бэкенде и открывает её комнату.
 * @param {CreateSessionFormProps} props - Пропсы формы.
 * @returns {import('react').ReactNode} Форма создания сессии.
 */
export function CreateSessionForm(props: CreateSessionFormProps) {
  const { draft } = props;
  const router = useRouter();
  const locale = useLocale();
  const [language, setLanguage] = useState<EditorLanguage>(draft.editorLanguage);
  const [isPrivate, setIsPrivate] = useState(draft.isPrivate);
  const [password, setPassword] = useState(draft.accessCode);
  const t = useTranslations("newSession");

  /**
   * Открывает комнату только что созданной сессии.
   * @param {ApiSession} session - Созданная сессия.
   * @returns {void}
   */
  function openCreatedSession(session: ApiSession): void {
    router.push(getLocalizedHref(`/sessions/${session.id}`, locale));
  }

  const createMutation = useMutation({ mutationFn: sessionApi.create, onSuccess: openCreatedSession });
  const isPasswordTooShort = isPrivate && password.length < MIN_PASSWORD_LENGTH;

  /**
   * Создаёт сессию: закрытую паролем, если отмечена приватность, иначе открытую для заявок.
   * @param {SubmitEvent<HTMLFormElement>} event - Событие отправки формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isPasswordTooShort) {
      return;
    }

    createMutation.mutate(isPrivate ? { access: "PASSWORD", password } : { access: "OPEN" });
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="session-title">{t("sessionTitleLabel")}</Label>
          <Input id="session-title" defaultValue={draft.title} />
        </div>

        <div className="space-y-2">
          <Label>{t("editorLanguageLabel")}</Label>
          <div className="flex gap-2">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                className={cn(
                  "rounded-md border px-4 py-2 font-mono text-sm font-medium transition-colors",
                  language === item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{t("privateSession")}</p>
              <p className="text-sm text-muted-foreground">{t("privateSessionHint")}</p>
            </div>
            <Checkbox
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              aria-label={t("privateSession")}
            />
          </div>

          {isPrivate && (
            <>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label={t("privateSession")}
                className="mt-4 font-mono"
              />
              {isPasswordTooShort && <p className="mt-2 text-sm text-destructive">{t("passwordTooShort")}</p>}
            </>
          )}
        </Card>

        <p className="text-sm text-muted-foreground">{t("telegramNotice")}</p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createMutation.isPending}
          disabled={isPasswordTooShort}
        >
          {createMutation.isPending ? t("launchingSession") : t("launchSession")}
        </Button>

        {createMutation.isError && <p className="text-sm text-destructive">{t("createError")}</p>}
      </form>
    </Card>
  );
}
