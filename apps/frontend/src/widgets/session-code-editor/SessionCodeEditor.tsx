"use client";

import { Card } from "@/shared/ui/card";
import { CodeMirrorEditor, type EditorLanguage } from "./CodeMirrorEditor";
import { useSessionCollaboration } from "./useSessionCollaboration";

const FILE_NAMES: Record<EditorLanguage, string> = {
  javascript: "main.ts",
  python: "main.py",
};

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "TypeScript",
  python: "Python",
};

/**
 * Пропсы редактора кода внутри сессии.
 */
export interface SessionCodeEditorProps {
  /** UUID сессии, определяющий совместный документ. */
  sessionId: string;

  /** UUID текущего пользователя для отображения его удалённого курсора. */
  currentUserId: string;

  /** Зафиксированный для этой сессии язык программирования. */
  language: EditorLanguage;
}

/**
 * Показывает рабочий редактор на зафиксированном для сессии языке.
 * @param {SessionCodeEditorProps} props - Данные комнаты для панели редактора.
 * @returns {import("react").ReactNode} Редактор кода с панелью инструментов.
 */
export function SessionCodeEditor(props: SessionCodeEditorProps) {
  const { sessionId, currentUserId, language } = props;
  const { collaboration, status } = useSessionCollaboration(sessionId, currentUserId);

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden font-mono text-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <span>{FILE_NAMES[language]}</span>

        <span
          className="font-sans text-xs text-muted-foreground"
          data-collaboration-status={status}
        >
          {LANGUAGE_LABELS[language]}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {collaboration && (
          <CodeMirrorEditor
            sharedText={collaboration.sharedText}
            awareness={collaboration.awareness}
            language={language}
          />
        )}
      </div>
    </Card>
  );
}
