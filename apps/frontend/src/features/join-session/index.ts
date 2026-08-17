// Слой features. Разрешено импортировать entities и shared.
import { isValidSessionId, type InterviewSession } from "@/entities/session";
import { MAX_AI_HINTS_PER_SESSION } from "@/shared/config/constants";

export interface JoinSessionParams {
  sessionId: string;
  password?: string;
}

export function canJoinSession(params: JoinSessionParams): boolean {
  return isValidSessionId(params.sessionId);
}

export function hintsRemaining(usedHints: number): number {
  return Math.max(0, MAX_AI_HINTS_PER_SESSION - usedHints);
}

export type { InterviewSession };
