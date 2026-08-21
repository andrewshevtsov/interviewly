// Слой pages: собирает виджеты в конкретную страницу приложения.
// Разрешено импортировать widgets, features, entities, shared.
import {buildToolbarState} from "@/widgets/session-toolbar";
import {canJoinSession} from "@/features/join-session";
import type {User} from "@/entities/user";

/**
 *
 * @param sessionId
 * @param user
 */
export function prepareInterviewSessionPage(sessionId: string, user: User) {
  return {
    canJoin: canJoinSession({sessionId}),
    toolbar: buildToolbarState({usedHints: 0, currentUser: user}),
  };
}
