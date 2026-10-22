// Слой features. Разрешено импортировать entities и shared.
import { isValidSessionId, type InterviewSession } from "@/entities/session";

/**
 * Параметры входа в сессию.
 */
export interface JoinSessionParams {
  /**
   * ID сессии.
   */
  sessionId: string;

  /**
   * Пароль сессии.
   */
  password?: string;
}

/**
 * Проверяет, можно ли войти в сессию с такими параметрами.
 * @param {JoinSessionParams} params - ID сессии и необязательный пароль.
 * @returns {boolean} `true`, если войти можно.
 */
export function canJoinSession(params: JoinSessionParams): boolean {
  return isValidSessionId(params.sessionId);
}

export type { InterviewSession };

export { RequestAccessForm } from "./RequestAccessForm";
export type { RequestAccessFormProps } from "./RequestAccessForm";
