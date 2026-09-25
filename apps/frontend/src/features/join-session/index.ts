// Слой features. Разрешено импортировать entities и shared.
import { isValidSessionId, type InterviewSession } from "@/entities/session";
import { MAX_AI_HINTS_PER_SESSION } from "@/shared/config/constants";

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

/**
 * Считает, сколько AI-подсказок ещё доступно в сессии.
 * @param {number} usedHints - Сколько подсказок уже использовано.
 * @returns {number} Сколько подсказок осталось, не меньше нуля.
 */
export function hintsRemaining(usedHints: number): number {
  return Math.max(0, MAX_AI_HINTS_PER_SESSION - usedHints);
}

export type { InterviewSession };

export { RequestAccessForm } from "./RequestAccessForm";
export type { RequestAccessFormProps } from "./RequestAccessForm";
