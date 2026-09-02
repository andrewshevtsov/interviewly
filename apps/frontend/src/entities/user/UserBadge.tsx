// Слой entities: презентационный компонент сущности "пользователь".
// Импортирует только entities (свой слайс) и shared.
import { formatUserLevel, type User } from "./index";

/**
 * Props for {@link UserBadge}.
 */
export interface UserBadgeProps {
  /**
   * User to display.
   */
  user: User;
}

/**
 * Renders a compact badge with the user's display name and level.
 * @param {UserBadgeProps} props - Props for the badge.
 * @returns {import('react').ReactNode} The user badge.
 */
export function UserBadge(props: UserBadgeProps) {
  const { user } = props;

  return <span>{`${user.displayName} (${formatUserLevel(user)})`}</span>;
}
