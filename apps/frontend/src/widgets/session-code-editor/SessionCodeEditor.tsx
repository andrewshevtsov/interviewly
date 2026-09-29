"use client";

// Слой widgets: редактор кода "Открытой сессии" - файл, синхронизация и запуск. Пока нет
// реалтайм-редактора, показывает демо-задачу, которую интервьюер выбирает кнопкой «новая задача»
import { useState, type ReactNode } from "react";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { SwitchDemoTaskButton } from "@/features/switch-demo-task";
import { useDemoTask, type DemoTask } from "@/entities/session";

const RUN_FEEDBACK_DELAY_MS = 900;
const RUN_OUTPUT = "[3, 2, 1] -> null";
const DEFAULT_FILE_NAME = "main.ts";
const FIRST_NUMBER = 1;

const DEMO_FILE_NAMES: Record<DemoTask["language"], string> = {
  JAVASCRIPT: "main.js",
  TYPESCRIPT: "main.ts",
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
 * Пропсы {@link DemoTaskSource}
 */
interface DemoTaskSourceProps {
  /**
   * Показанная задача
   */
  task: DemoTask;
}

/**
 * Демо-задача: условие комментарием и код кандидата построчно
 * @param {DemoTaskSourceProps} props - Показанная задача
 * @returns {import('react').ReactNode} Строки кода
 */
function DemoTaskSource(props: DemoTaskSourceProps) {
  const { task } = props;
  const lines = [`// ${task.task}`, ...task.code.split("\n")];

  return (
    <>
      {lines.map((line, index) => (
        <CodeLine key={index} number={index + FIRST_NUMBER}>
          <span className={index === 0 ? "whitespace-pre-wrap text-muted-foreground" : "whitespace-pre"}>
            {line}
          </span>
        </CodeLine>
      ))}
    </>
  );
}

/**
 * TypeScript source shown on the "main.ts" tab.
 * @returns {import('react').ReactNode} The TypeScript code lines.
 */
function TypeScriptSource() {
  const t = useTranslations("session");

  return (
    <>
      <CodeLine number={1}>
        <span className="text-muted-foreground">// {t("exampleTask")}</span>
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
   * Сессия, чья демо-задача показывается в редакторе
   */
  sessionId: string;

  /**
   * Текущий пользователь интервьюер
   */
  isInterviewer: boolean;

  /**
   * Number of participants currently connected, shown next to the sync status.
   */
  participantsCount: number;
}

/**
 * Code editor for the "Открытая сессия" screen: file name, sync/participant status, the code
 * itself and a "Запустить код" action. В демо-режиме показывает задачу, выбранную интервьюером
 * @param {SessionCodeEditorProps} props - Props for the editor.
 * @returns {import('react').ReactNode} The session code editor.
 */
export function SessionCodeEditor(props: SessionCodeEditorProps) {
  const { sessionId, isInterviewer, participantsCount } = props;
  const demoTaskQuery = useDemoTask(sessionId);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const t = useTranslations("session");

  const isDemo = demoTaskQuery.data?.enabled ?? false;
  const demoTask = demoTaskQuery.data?.current ?? null;
  const fileName = demoTask ? DEMO_FILE_NAMES[demoTask.language] : DEFAULT_FILE_NAME;

  /**
   * Simulates running the file: briefly shows a running state, then a canned output line.
   * @returns {void}
   */
  function handleRun(): void {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput(RUN_OUTPUT);
    }, RUN_FEEDBACK_DELAY_MS);
  }

  /**
   * Содержимое редактора: демо-задача, приглашение выбрать её или статичный пример
   * @returns {import('react').ReactNode} Строки кода или подсказка
   */
  function renderSource() {
    if (demoTask) {
      return <DemoTaskSource task={demoTask} />;
    }

    if (isDemo) {
      return <p className="font-sans text-muted-foreground">{t("demoTaskEmpty")}</p>;
    }

    return <TypeScriptSource />;
  }

  return (
    <Card className="flex flex-1 flex-col overflow-hidden font-mono text-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="rounded-md bg-muted px-3 py-1.5 text-xs text-foreground">{fileName}</span>
          {demoTask && (
            <span className="text-xs text-muted-foreground">
              {t("demoTaskCounter")} {demoTask.index + FIRST_NUMBER}/{demoTask.total}
            </span>
          )}
        </span>

        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          {isDemo && isInterviewer && <SwitchDemoTaskButton sessionId={sessionId} />}
          <span className="flex items-center gap-1.5 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {t("synced")}
          </span>
          {participantsCount} {t("participantsSuffix")}
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-auto p-4">{renderSource()}</div>

      {output && (
        <p className="border-t border-border px-4 py-2 text-xs text-success">
          {t("outputLabel")}: {output}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-xs">
        <span className="text-muted-foreground">{t("syntaxHint")}</span>
        <Button
          size="sm"
          className="uppercase tracking-wide"
          disabled={isRunning}
          onClick={handleRun}
        >
          {isRunning ? t("running") : t("runCode")}
        </Button>
      </div>
    </Card>
  );
}
