// Слой features. Разрешено импортировать entities и shared.
import { isValidSessionId, type InterviewSession } from "@/entities/session";
import { MAX_AI_HINTS_PER_SESSION } from "@/shared/config/constants";

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
 * Checks whether a session can be joined with the given params.
 * @param {JoinSessionParams} params - Session ID and optional password.
 * @returns {boolean} `true` if the session can be joined.
 */
export function canJoinSession(params: JoinSessionParams): boolean {
  return isValidSessionId(params.sessionId);
}

/**
 * Calculates how many AI hints are still available in a session.
 * @param {number} usedHints - Number of hints already used.
 * @returns {number} Number of hints remaining, never below zero.
 */
export function hintsRemaining(usedHints: number): number {
  return Math.max(0, MAX_AI_HINTS_PER_SESSION - usedHints);
}

export type { InterviewSession };
