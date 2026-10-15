import { refreshAccessToken } from "@/shared/api/http-client";
import { useAuthStore } from "@/shared/model/auth-store";

export type RunnableLanguage = "javascript" | "python" | "typescript";

/** Запрос на выполнение исходного кода. */
export interface ExecuteCodeRequest {
  /** Сессия, участие в которой проверяет coderunner. */
  sessionId: string;

  /** Язык выполнения. */
  language: RunnableLanguage;

  /** Исходный код программы. */
  code: string;
}

/** Нормализованный ответ coderunner. */
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

const CODERUNNER_URL = (process.env.NEXT_PUBLIC_CODERUNNER_URL ?? "http://localhost:3003")
  .replace(/\/+$/, "");
const HTTP_UNAUTHORIZED = 401;

/**
 * Отправляет один авторизованный запрос в coderunner.
 * @param {ExecuteCodeRequest} request - Сессия, язык и исходный код.
 * @param {string | null} accessToken - Текущий access JWT.
 * @returns {Promise<Response>} Необработанный HTTP-ответ coderunner.
 */
function sendExecutionRequest(
  request: ExecuteCodeRequest,
  accessToken: string | null,
): Promise<Response> {
  return fetch(`${CODERUNNER_URL}/execution`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });
}

/**
 * Отправляет текущий код напрямую в coderunner.
 * @param {ExecuteCodeRequest} request - Язык и исходный код.
 * @returns {Promise<ExecutionResult>} Результат выполнения программы.
 */
export async function executeCode(request: ExecuteCodeRequest): Promise<ExecutionResult> {
  let response = await sendExecutionRequest(request, useAuthStore.getState().accessToken);

  if (response.status === HTTP_UNAUTHORIZED) {
    const accessToken = await refreshAccessToken();
    response = await sendExecutionRequest(request, accessToken);
  }

  if (!response.ok) {
    throw new Error(`Coderunner request failed with status ${response.status}`);
  }

  return response.json() as Promise<ExecutionResult>;
}
