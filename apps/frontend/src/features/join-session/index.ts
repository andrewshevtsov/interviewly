// Слой features. Разрешено импортировать entities и shared.
import {isValidSessionId, type InterviewSession} from "@/entities/session";
import {MAX_AI_HINTS_PER_SESSION} from "@/shared/config/constants";

/**
 * Interface JoinSessionParams
 */
export interface JoinSessionParams {

  /**
   * SesionID
   */
  sessionId: string;

  /**
   * Password
   */
  password?: string;
}

/**
 * Params
 * @param params
 */
export function canJoinSession(params: JoinSessionParams): boolean {
  return isValidSessionId(params.sessionId);
}

/**
 *
 * @param usedHints
 */
export function hintsRemaining(usedHints: number): number {
  return Math.max(0, MAX_AI_HINTS_PER_SESSION - usedHints);
}

export type {InterviewSession};
