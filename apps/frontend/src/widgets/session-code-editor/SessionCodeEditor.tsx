"use client";

// Слой widgets: редактор кода "Открытой сессии" - вкладки файлов, синхронизация и запуск.
import { useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type { EditorLanguage } from "@/entities/session";

const RUN_FEEDBACK_DELAY_MS = 900;

const FILE_NAMES: Record<EditorLanguage, string> = {
  python: "main.py",
  javascript: "main.ts",
};

const RUN_OUTPUT: Record<EditorLanguage, string> = {
  python: "[3, 2, 1] -> None",
  javascript: "[3, 2, 1] -> null",
};

/**
 * Props for {@link CodeLine}.
 */
interface CodeLineProps {
  /**
   * Line number shown in the gutter.
   */
  number: number;

  /**
   * Indentation level (0, 1 or 2), applied as left padding.
   */
  indent?: number;

  /**
   * Line content.
   */
  children: ReactNode;
}

const INDENT_CLASSES = ["pl-0", "pl-4", "pl-8"];

/**
 * A single numbered line inside the code editor.
 * @param {CodeLineProps} props - Line number, indentation and content.
 * @returns {import('react').ReactNode} The code line.
 */
function CodeLine(props: CodeLineProps) {
  const { number, indent = 0, children } = props;

  return (
    <p className="flex gap-3">
      <span className="w-5 select-none text-right text-muted-foreground/60">{number}</span>
      <span className={INDENT_CLASSES[indent]}>{children}</span>
    </p>
  );
}

/**
 * Python source shown on the "main.py" tab.
 * @returns {import('react').ReactNode} The Python code lines.
 */
function PythonSource() {
  return (
    <>
      <CodeLine number={1}>
        <span className="text-muted-foreground">
          # Задача: развернуть односвязный список на месте
        </span>
      </CodeLine>
      <CodeLine number={2}>
        <span className="text-primary">def</span> reverse_list(head):
      </CodeLine>
      <CodeLine number={3} indent={1}>
        prev, curr = None, head
      </CodeLine>
      <CodeLine number={4} indent={1}>
        <span className="text-primary">while</span> curr:
      </CodeLine>
      <CodeLine number={5} indent={2}>
        next_temp = curr.next
      </CodeLine>
      <CodeLine number={6} indent={2}>
        curr.next = prev
      </CodeLine>
      <CodeLine number={7} indent={2}>
        prev = curr
      </CodeLine>
      <CodeLine number={8} indent={2}>
        curr = next_temp
      </CodeLine>
      <CodeLine number={9} indent={1}>
        <span className="text-primary">return</span> prev
      </CodeLine>
    </>
  );
}

/**
 * TypeScript source shown on the "main.ts" tab.
 * @returns {import('react').ReactNode} The TypeScript code lines.
 */
function TypeScriptSource() {
  return (
    <>
      <CodeLine number={1}>
        <span className="text-muted-foreground">
          // Задача: развернуть односвязный список на месте
        </span>
      </CodeLine>
      <CodeLine number={2}>
        <span className="text-primary">function</span> reverseList(head: ListNode | null) {"{"}
      </CodeLine>
      <CodeLine number={3} indent={1}>
        <span className="text-primary">let</span> prev: ListNode | null ={" "}
        <span className="text-primary">null</span>;
      </CodeLine>
      <CodeLine number={4} indent={1}>
        <span className="text-primary">let</span> curr = head;
      </CodeLine>
      <CodeLine number={5} indent={1}>
        <span className="text-primary">while</span> (curr) {"{"}
      </CodeLine>
      <CodeLine number={6} indent={2}>
        <span className="text-primary">const</span> next = curr.next;
      </CodeLine>
      <CodeLine number={7} indent={2}>
        curr.next = prev;
      </CodeLine>
      <CodeLine number={8} indent={2}>
        prev = curr;
      </CodeLine>
      <CodeLine number={9} indent={2}>
        curr = next;
      </CodeLine>
      <CodeLine number={10} indent={1}>
        {"}"}
      </CodeLine>
      <CodeLine number={11} indent={1}>
        <span className="text-primary">return</span> prev;
      </CodeLine>
      <CodeLine number={12}>{"}"}</CodeLine>
    </>
  );
}

/**
 * Props for {@link SessionCodeEditor}.
 */
export interface SessionCodeEditorProps {
  /**
   * Number of participants currently connected, shown next to the sync status.
   */
  participantsCount: number;
}

/**
 * Code editor for the "Открытая сессия" screen: file tabs, sync/participant status, the code
 * itself and a "Запустить код" action.
 * @param {SessionCodeEditorProps} props - Props for the editor.
 * @returns {import('react').ReactNode} The session code editor.
 */
export function SessionCodeEditor(props: SessionCodeEditorProps) {
  const { participantsCount } = props;
  const [activeFile, setActiveFile] = useState<EditorLanguage>("python");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  /**
   * Simulates running the active file: briefly shows a running state, then a canned output line.
   * @returns {void}
   */
  function handleRun(): void {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput(RUN_OUTPUT[activeFile]);
    }, RUN_FEEDBACK_DELAY_MS);
  }

  return (
    <Card className="flex flex-1 flex-col overflow-hidden font-mono text-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          {(Object.keys(FILE_NAMES) as EditorLanguage[]).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => {
                setActiveFile(language);
                setOutput(null);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                activeFile === language
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {FILE_NAMES[language]}
            </button>
          ))}
        </div>

        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Synced
          </span>
          {participantsCount} участника
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-auto p-4">
        {activeFile === "python" ? <PythonSource /> : <TypeScriptSource />}
      </div>

      {output && (
        <p className="border-t border-border px-4 py-2 text-xs text-success">Вывод: {output}</p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-xs">
        <span className="text-muted-foreground">Подсветка синтаксиса и автокомплит включены.</span>
        <Button
          size="sm"
          className="uppercase tracking-wide"
          disabled={isRunning}
          onClick={handleRun}
        >
          {isRunning ? "Выполняется…" : "Запустить код"}
        </Button>
      </div>
    </Card>
  );
}
