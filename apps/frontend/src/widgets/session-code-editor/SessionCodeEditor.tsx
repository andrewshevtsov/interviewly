"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { RunCodeButton, type ExecutionResult } from "@/features/run-code";
import { useTranslations } from "@/shared/i18n-context";
import { Card } from "@/shared/ui/card";
import { CodeMirrorEditor, type EditorLanguage } from "./CodeMirrorEditor";
import { useSessionCollaboration } from "./useSessionCollaboration";

const FILE_NAMES: Record<EditorLanguage, string> = {
  javascript: "main.js",
  typescript: "main.ts",
  python: "main.py",
};

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

const DEFAULT_OUTPUT_HEIGHT = 160;
const MIN_OUTPUT_HEIGHT = 96;
const MAX_OUTPUT_HEIGHT_RATIO = 0.65;

/** Выполнение ещё не завершилось. */
interface RunningOutput {
  /** Текущий этап выполнения. */
  status: "running";
}

/** Код успешно выполнен. */
interface SuccessfulOutput {
  /** Текущий этап выполнения. */
  status: "success";

  /** Ответ coderunner. */
  result: ExecutionResult;
}

/** Coderunner недоступен или отклонил запрос. */
interface FailedOutput {
  /** Текущий этап выполнения. */
  status: "error";
}

/** Состояние отображаемой консоли. */
type OutputState = RunningOutput | SuccessfulOutput | FailedOutput;

const OUTPUT_STATE_KEY = "state";

/** Проверяет состояние консоли, полученное из совместного документа. */
function isOutputState(value: unknown): value is OutputState {
  if (typeof value !== "object" || value === null || !("status" in value)) {
    return false;
  }

  const status = value.status;

  return status === "running" || status === "success" || status === "error";
}

/** Координаты и размеры в момент начала перетаскивания. */
interface ResizeStart {
  /** Вертикальная координата указателя. */
  pointerY: number;

  /** Исходная высота консоли. */
  panelHeight: number;

  /** Максимальная высота консоли. */
  maxHeight: number;
}

/** Пропсы редактора кода внутри сессии. */
export interface SessionCodeEditorProps {
  /** UUID сессии, определяющий совместный документ. */
  sessionId: string;

  /** UUID текущего пользователя для отображения его удалённого курсора. */
  currentUserId: string;

  /** Зафиксированный для этой сессии язык программирования. */
  language: EditorLanguage;
}

/**
 * Показывает рабочий совместный редактор на зафиксированном для сессии языке.
 * @param {SessionCodeEditorProps} props - Данные комнаты для панели редактора.
 * @returns {import("react").ReactNode} Редактор кода с панелью инструментов.
 */
export function SessionCodeEditor(props: SessionCodeEditorProps) {
  const { sessionId, currentUserId, language } = props;
  const { collaboration, status } = useSessionCollaboration(sessionId, currentUserId);
  const t = useTranslations("session");
  const [output, setOutput] = useState<OutputState | null>(null);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_OUTPUT_HEIGHT);
  const outputPanelRef = useRef<HTMLDivElement | null>(null);
  const resizeStartRef = useRef<ResizeStart | null>(null);

  useEffect(() => {
    if (!collaboration) {
      setOutput(null);

      return;
    }
    const { sharedOutput } = collaboration;

    /** Переносит общее состояние запуска в локальное состояние интерфейса. */
    function updateOutput(): void {
      const sharedState = sharedOutput.get(OUTPUT_STATE_KEY);
      setOutput(isOutputState(sharedState) ? sharedState : null);
    }

    updateOutput();
    sharedOutput.observe(updateOutput);

    return () => sharedOutput.unobserve(updateOutput);
  }, [collaboration]);

  /** Публикует состояние консоли всем участникам сессии. */
  function publishOutput(nextOutput: OutputState): void {
    collaboration?.sharedOutput.set(OUTPUT_STATE_KEY, nextOutput);
  }

  /**
   * Запоминает исходные координаты перед изменением высоты консоли.
   * @param {ReactPointerEvent<HTMLButtonElement>} event - Начальное событие указателя.
   */
  function startResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    const containerHeight = outputPanelRef.current?.parentElement?.clientHeight ?? 0;
    resizeStartRef.current = {
      pointerY: event.clientY,
      panelHeight: outputHeight,
      maxHeight: containerHeight * MAX_OUTPUT_HEIGHT_RATIO,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * Меняет высоту консоли: движение вверх увеличивает её.
   * @param {ReactPointerEvent<HTMLButtonElement>} event - Текущее событие указателя.
   */
  function resizeOutput(event: ReactPointerEvent<HTMLButtonElement>): void {
    const start = resizeStartRef.current;
    if (!start) {
      return;
    }

    const nextHeight = start.panelHeight + start.pointerY - event.clientY;
    setOutputHeight(Math.min(start.maxHeight, Math.max(MIN_OUTPUT_HEIGHT, nextHeight)));
  }

  /** Завершает изменение высоты консоли. */
  function stopResize(): void {
    resizeStartRef.current = null;
  }

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

      {output && (
        <div
          ref={outputPanelRef}
          className="relative shrink-0 overflow-auto border-t border-border bg-muted/30"
          style={{ height: outputHeight }}
        >
          <div className="sticky top-0 flex items-center border-b border-border bg-card px-4 py-2">
            <span className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("outputLabel")}
            </span>
            <button
              type="button"
              aria-label={t("resizeOutput")}
              className={`absolute right-2 top-1.5 flex h-6 w-8 cursor-ns-resize
                items-center justify-center rounded hover:bg-accent`}
              onPointerDown={startResize}
              onPointerMove={resizeOutput}
              onPointerUp={stopResize}
              onPointerCancel={stopResize}
            >
              <span className="h-0.5 w-4 rounded bg-muted-foreground" />
            </button>
          </div>

          <div className="p-4">
            {output.status === "running" && (
              <span className="font-sans text-muted-foreground">{t("running")}</span>
            )}
            {output.status === "error" && (
              <span className="font-sans text-destructive">{t("runCodeError")}</span>
            )}
            {output.status === "success" && (
              <>
                {output.result.stdout && <pre className="whitespace-pre-wrap">{output.result.stdout}</pre>}
                {output.result.stderr && (
                  <pre className="whitespace-pre-wrap text-destructive">{output.result.stderr}</pre>
                )}
                {!output.result.stdout && !output.result.stderr && (
                  <span className="font-sans text-muted-foreground">
                    {output.result.message ?? t("emptyOutput")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-border px-4 py-3">
        <RunCodeButton
          sessionId={sessionId}
          language={language}
          getCode={() => collaboration?.sharedText.toString() ?? ""}
          disabled={!collaboration}
          onRunStart={() => publishOutput({ status: "running" })}
          onRunSuccess={(result) => publishOutput({ status: "success", result })}
          onRunError={() => publishOutput({ status: "error" })}
        />
      </div>
    </Card>
  );
}
