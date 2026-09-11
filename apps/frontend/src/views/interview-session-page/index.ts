// Слой views: собирает виджеты в конкретную страницу приложения.
// Разрешено импортировать widgets, features, entities, shared.
import { canJoinSession } from "@/features/join-session";

/**
 * Prepares the derived state needed to render the interview session page.
 * @param {string} sessionId - ID of the interview session being displayed.
 * @returns {object} Whether the session can be joined.
 */
export function prepareInterviewSessionPage(sessionId: string) {
  return { canJoin: canJoinSession({ sessionId }) };
}

export { InterviewSessionPage } from "./InterviewSessionPage";
export type { InterviewSessionPageProps } from "./InterviewSessionPage";
