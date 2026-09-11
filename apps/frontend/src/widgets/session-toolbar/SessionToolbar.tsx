// Слой widgets: композиция из нескольких features/entities в один блок UI.
// Разрешено импортировать features, entities, shared.
import { UserBadge } from "@/entities/user";
import { getServerTranslations } from "@/shared/i18n-server";
import { buildToolbarState, type SessionToolbarProps } from "./index";

/**
 * Renders the session toolbar: current user badge, hints left and session level.
 * @param {SessionToolbarProps} props - Props for the toolbar.
 * @returns {import('react').ReactNode} The session toolbar.
 */
export async function SessionToolbar(props: SessionToolbarProps) {
  const state = buildToolbarState(props);
  const t = await getServerTranslations("session");

  return (
    <div>
      <UserBadge user={props.currentUser} />
      <span>
        {t("hintsLeft")}: {state.hintsLeft}
      </span>
      <span>
        {t("sessionLevel")}: {state.sessionLevelLabel}
      </span>
    </div>
  );
}
