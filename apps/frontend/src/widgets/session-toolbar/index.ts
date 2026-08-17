// Слой widgets: композиция из нескольких features/entities в один блок UI.
// Разрешено импортировать features, entities, shared.
import { hintsRemaining } from "@/features/join-session";
import { describeSessionLevel } from "@/entities/session";
import { formatUserLevel, type User } from "@/entities/user";

export interface SessionToolbarProps {
  usedHints: number;
  currentUser: User;
}

export function buildToolbarState(props: SessionToolbarProps) {
  return {
    hintsLeft: hintsRemaining(props.usedHints),
    userLevel: formatUserLevel(props.currentUser),
    sessionLevelLabel: describeSessionLevel(props.currentUser.level),
  };
}
