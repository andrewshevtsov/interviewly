// Слой widgets: композиция из нескольких features/entities в один блок UI.
// Разрешено импортировать features, entities, shared.
import { UserBadge } from "@/entities/user";
import { buildToolbarState, type SessionToolbarProps } from "./index";

/**
 * Renders the session toolbar: current user badge, hints left and session level.
 * @param {SessionToolbarProps} props - Props for the toolbar.
 * @returns {import('react').ReactNode} The session toolbar.
 */
export function SessionToolbar(props: SessionToolbarProps) {
  const state = buildToolbarState(props);

  return (
    <div>
      <UserBadge user={props.currentUser} />
      <span>{`Hints left: ${state.hintsLeft}`}</span>
      <span>{`Session level: ${state.sessionLevelLabel}`}</span>
    </div>
  );
}
