// Слой widgets: композиция из нескольких features/entities в один блок UI.
// Разрешено импортировать features, entities, shared.
import { hintsRemaining } from "@/features/join-session";
import { describeSessionLevel } from "@/entities/session";
import { formatUserLevel, type User } from "@/entities/user";

/**
 * Input needed to build the session toolbar state.
 */
export interface SessionToolbarProps {
  /**
   * Number of AI hints already used in the session.
   */
  usedHints: number;

  /**
   * User the toolbar is shown to.
   */
  currentUser: User;
}

/**
 * Derives the display state for the session toolbar.
 * @param {SessionToolbarProps} props - Used hints count and current user.
 * @returns {object} Hints left, formatted user level and session level label.
 */
export function buildToolbarState(props: SessionToolbarProps) {
  return {
    hintsLeft: hintsRemaining(props.usedHints),
    userLevel: formatUserLevel(props.currentUser),
    sessionLevelLabel: describeSessionLevel(props.currentUser.level),
  };
}

export { SessionToolbar } from "./SessionToolbar";
