"use client";

// Слой features: форма создания сессии - название, язык редактора, приватность и приглашение.
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { EditorLanguage, NewSessionDraft } from "@/entities/session";

/**
 * A single option in the "Язык редактора" toggle group.
 */
interface LanguageOption {
  /**
   * Language identifier.
   */
  id: EditorLanguage;

  /**
   * Language label, shown in monospace.
   */
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: "python", label: "python" },
  { id: "javascript", label: "javascript" },
];

const COPY_CONFIRMATION_MS = 2000;

// ID демо-сессии, которую открывает "Запустить сессию" - та же сессия #4092, что уже
// фигурирует в истории (DEMO_SESSION_HISTORY) и в моках на главной странице.
const DEMO_LAUNCHED_SESSION_ID = "abcdef123456";

/**
 * Props for {@link CreateSessionForm}.
 */
export interface CreateSessionFormProps {
  /**
   * Initial draft values to populate the form with.
   */
  draft: NewSessionDraft;
}

/**
 * Session creation form: title, editor language, a private/access-code toggle and a copyable
 * invite link.
 * @param {CreateSessionFormProps} props - Props for the form.
 * @returns {import('react').ReactNode} The create-session form.
 */
export function CreateSessionForm(props: CreateSessionFormProps) {
  const { draft } = props;
  const router = useRouter();
  const [language, setLanguage] = useState<EditorLanguage>(draft.editorLanguage);
  const [isPrivate, setIsPrivate] = useState(draft.isPrivate);
  const [copied, setCopied] = useState(false);

  /**
   * Opens the newly created (demo) session.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    router.push(`/sessions/${DEMO_LAUNCHED_SESSION_ID}`);
  }

  /**
   * Copies the invite link to the clipboard and briefly shows a confirmation.
   * @returns {Promise<void>} Resolves once the copy attempt settles.
   */
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(draft.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    } catch {
      // Буфер обмена недоступен (например, нет разрешения)
    }
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="session-title">Название</Label>
          <Input id="session-title" defaultValue={draft.title} />
        </div>

        <div className="space-y-2">
          <Label>Язык редактора</Label>
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
              <p className="font-semibold">Закрытая сессия</p>
              <p className="text-sm text-muted-foreground">Вход только по паролю.</p>
            </div>
            <Checkbox
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              aria-label="Закрытая сессия"
            />
          </div>

          {isPrivate && <Input readOnly value={draft.accessCode} className="mt-4 font-mono" />}
        </Card>

        <div className="space-y-2">
          <Label htmlFor="session-invite-link">Ссылка-приглашение</Label>
          <div className="flex gap-2">
            <Input
              id="session-invite-link"
              readOnly
              value={draft.inviteLink}
              className="font-mono text-muted-foreground"
            />
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Всем приглашённым Telegram-бот пришлёт уведомление о запуске сессии.
        </p>

        <Button type="submit" size="lg" className="w-full">
          Запустить сессию
        </Button>
      </form>
    </Card>
  );
}
