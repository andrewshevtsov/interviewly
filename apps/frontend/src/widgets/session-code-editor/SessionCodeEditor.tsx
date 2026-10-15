"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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
const DATE_PART_LENGTH = 2;
const MONTH_NUMBER_OFFSET = 1;
const SINGLE_LOG_ENTRY = 1;
const OUTPUT_SEPARATOR = "=============================";

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

/** Одна запись общего журнала запусков. */
type OutputLogEntry = OutputState & {
  /** Уникальный идентификатор запуска для обновления его результата. */
  id: string;

  /** Отображаемое имя запустившего код участника. */
  userName: string;

  /** Время запуска в миллисекундах Unix. */
  startedAt: number;
};

/**
 * Проверяет запись консоли, полученную из совместного документа.
 * @param {unknown} value Непроверенное значение Yjs.
 * @returns {boolean} Признак корректной записи журнала.
 */
function isOutputLogEntry(value: unknown): value is OutputLogEntry {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    !("id" in value) ||
    !("userName" in value) ||
    !("startedAt" in value)
  ) {
    return false;
  }

  const hasValidBase =
    typeof value.id === "string" &&
    typeof value.userName === "string" &&
    typeof value.startedAt === "number";

  if (!hasValidBase) {
    return false;
  }

  if (value.status === "success") {
    return "result" in value && typeof value.result === "object" && value.result !== null;
  }

  return value.status === "running" || value.status === "error";
}

/** Отформатированные дата и время запуска. */
interface FormattedStartedAt {
  /** Дата в формате ДД.ММ.ГГГГ. */
  date: string;

  /** Время в формате ЧЧ:ММ:СС. */
  time: string;
}

/**
 * Дополняет числовую часть даты ведущим нулём.
 * @param {number} part Числовая часть даты или времени.
 * @returns {string} Двузначное представление части.
 */
function padDatePart(part: number): string {
  return String(part).padStart(DATE_PART_LENGTH, "0");
}

/**
 * Форматирует время запуска как требуемые дату и время.
 * @param {number} startedAt Время запуска в миллисекундах Unix.
 * @returns {FormattedStartedAt} Дата и время для заголовка записи.
 */
function formatStartedAt(startedAt: number): FormattedStartedAt {
  const value = new Date(startedAt);

  return {
    date: `${padDatePart(value.getDate())}.${padDatePart(value.getMonth() + MONTH_NUMBER_OFFSET)}.${value.getFullYear()}`,
    time: `${padDatePart(value.getHours())}:${padDatePart(value.getMinutes())}:${padDatePart(value.getSeconds())}`,
  };
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

  /** Отображаемое имя текущего пользователя для журнала запусков. */
  currentUserName: string;

  /** Зафиксированный для этой сессии язык программирования. */
  language: EditorLanguage;
}

/**
 * Показывает рабочий совместный редактор на зафиксированном для сессии языке.
 * @param {SessionCodeEditorProps} props - Данные комнаты для панели редактора.
 * @returns {import("react").ReactNode} Редактор кода с панелью инструментов.
 */
export function SessionCodeEditor(props: SessionCodeEditorProps) {
  const { sessionId, currentUserId, currentUserName, language } = props;
  const { collaboration, status } = useSessionCollaboration(sessionId, currentUserId);
  const t = useTranslations("session");
  const [outputLog, setOutputLog] = useState<OutputLogEntry[]>([]);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_OUTPUT_HEIGHT);
  const outputPanelRef = useRef<HTMLDivElement | null>(null);
  const resizeStartRef = useRef<ResizeStart | null>(null);
  const activeExecutionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!collaboration) {
      setOutputLog([]);

      return;
    }
    const { sharedOutputLog } = collaboration;

    /** Переносит общий журнал запусков в локальное состояние интерфейса. */
    function updateOutputLog(): void {
      setOutputLog(sharedOutputLog.toArray().filter(isOutputLogEntry));
    }

    updateOutputLog();
    sharedOutputLog.observe(updateOutputLog);

    return () => sharedOutputLog.unobserve(updateOutputLog);
  }, [collaboration]);

  useEffect(() => {
    const panel = outputPanelRef.current;
    if (panel) {
      panel.scrollTop = 0;
    }
  }, [outputLog]);

  /** Добавляет новый запуск в общий журнал. */
  function startExecution(): void {
    if (!collaboration) {
      return;
    }

    const id = crypto.randomUUID();
    const entry: OutputLogEntry = {
      id,
      userName: currentUserName,
      startedAt: Date.now(),
      status: "running",
    };
    activeExecutionIdRef.current = id;
    collaboration.sharedOutputLog.insert(0, [entry]);
  }

  /**
   * Обновляет результат текущего запуска в общем журнале.
   * @param {OutputState} nextOutput Итог выполнения или ошибка запроса.
   */
  function finishExecution(nextOutput: OutputState): void {
    const id = activeExecutionIdRef.current;
    const sharedLog = collaboration?.sharedOutputLog;
    if (!id || !sharedLog) {
      return;
    }

    const entries = sharedLog.toArray();
    const index = entries.findIndex((entry) => isOutputLogEntry(entry) && entry.id === id);
    const currentEntry = entries[index];
    if (index < 0 || !isOutputLogEntry(currentEntry)) {
      return;
    }

    sharedLog.doc?.transact(() => {
      sharedLog.delete(index, SINGLE_LOG_ENTRY);
      sharedLog.insert(index, [{ ...currentEntry, ...nextOutput }]);
    });
    activeExecutionIdRef.current = null;
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

      {outputLog.length > 0 && (
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
            {outputLog.map((entry, index) => {
              const startedAt = formatStartedAt(entry.startedAt);

              return (
                <div key={entry.id}>
                  {index > 0 && (
                    <div className="my-3 overflow-hidden whitespace-nowrap text-muted-foreground">
                      {OUTPUT_SEPARATOR}
                    </div>
                  )}
                  <div className="mb-2 font-sans text-xs text-muted-foreground">
                    {t("codeRunBy")} {entry.userName} {t("dateLabel")} {startedAt.date}{" "}
                    {t("timeLabel")} {startedAt.time}
                  </div>
                  {entry.status === "running" && (
                    <span className="font-sans text-muted-foreground">{t("running")}</span>
                  )}
                  {entry.status === "error" && (
                    <span className="font-sans text-destructive">{t("runCodeError")}</span>
                  )}
                  {entry.status === "success" && (
                    <>
                      {entry.result.stdout && (
                        <pre className="whitespace-pre-wrap">{entry.result.stdout}</pre>
                      )}
                      {entry.result.stderr && (
                        <pre className="whitespace-pre-wrap text-destructive">
                          {entry.result.stderr}
                        </pre>
                      )}
                      {!entry.result.stdout && !entry.result.stderr && (
                        <span className="font-sans text-muted-foreground">
                          {entry.result.message ?? t("emptyOutput")}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-border px-4 py-3">
        <RunCodeButton
          sessionId={sessionId}
          language={language}
          getCode={() => collaboration?.sharedText.toString() ?? ""}
          disabled={!collaboration}
          onRunStart={startExecution}
          onRunSuccess={(result) => finishExecution({ status: "success", result })}
          onRunError={() => finishExecution({ status: "error" })}
        />
      </div>
    </Card>
  );
}
