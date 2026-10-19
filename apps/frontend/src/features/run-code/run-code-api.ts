import { httpClient } from "@/shared/api/http-client";

export type RunnableLanguage = "javascript" | "python" | "typescript";

/** Запрос на выполнение исходного кода. */
export interface ExecuteCodeRequest {
  /** Сессия, участие в которой проверяет backend. */
  sessionId: string;

  /** Язык выполнения. */
  language: RunnableLanguage;

  /** Исходный код программы. */
  code: string;
}

/** Нормализованный результат, который сервер записывает в общий документ. */
export interface ExecutionResult {
  /** Стандартный вывод программы. */
  stdout: string;

  /** Стандартный вывод ошибок программы. */
  stderr: string;

  /** Код завершения процесса. */
  exitCode: number | null;

  /** Сигнал, завершивший процесс. */
  signal: string | null;

  /** Статус выполнения Piston. */
  status: string | null;

  /** Дополнительное сообщение Piston. */
  message: string | null;

  /** Максимально использованная память в байтах. */
  memory: number | null;

  /** Процессорное время в миллисекундах. */
  cpuTime: number | null;

  /** Полное время выполнения в миллисекундах. */
  wallTime: number | null;
}

export interface QueuedExecution {
  executionId: string;
  status: "QUEUED";
  queuedAt: number;
}

/**
 * Ставит текущий код в серверную очередь выполнения.
 * @param {ExecuteCodeRequest} request - Язык и исходный код.
 * @returns {Promise<QueuedExecution>} Подтверждение постановки в очередь.
 */
export async function executeCode(request: ExecuteCodeRequest): Promise<QueuedExecution> {
  const { sessionId, ...body } = request;
  return httpClient
    .post<QueuedExecution>(`/sessions/${sessionId}/code-executions`, body)
    .then((response) => response.data);
}
