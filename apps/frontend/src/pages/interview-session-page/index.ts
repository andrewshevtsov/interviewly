// Слой pages: собирает виджеты в конкретную страницу приложения.
// Разрешено импортировать widgets, features, entities, shared.
import { buildToolbarState } from "@/widgets/session-toolbar";
import { canJoinSession } from "@/features/join-session";
import type { User } from "@/entities/user";

/**
 * Prepares the derived state needed to render the interview session page.
 * @param {string} sessionId - ID of the interview session being displayed.
 * @param {User} user - Currently logged-in user.
 * @returns {object} Whether the session can be joined and the toolbar state.
 */
export function prepareInterviewSessionPage(sessionId: string, user: User) {
  return {
    canJoin: canJoinSession({ sessionId }),
    toolbar: buildToolbarState({ usedHints: 0, currentUser: user }),
  };
}

export { InterviewSessionPage } from "./InterviewSessionPage";
export type { InterviewSessionPageProps } from "./InterviewSessionPage";
