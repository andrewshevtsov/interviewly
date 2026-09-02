// Слой entities: сущность "пользователь". Импортирует только shared.
import { formatLevel } from "@/shared/lib/format-level";

/**
 * A platform user (candidate or interviewer).
 */
export interface User {
  /**
   * Unique user identifier.
   */
  id: string;

  /**
   * Name shown in the UI.
   */
  displayName: string;

  /**
   * Technologies the user works with.
   */
  stack: string[];

  /**
   * Experience level, e.g. "junior", "middle", "senior".
   */
  level: string;
}

/**
 * Formats a user's experience level for display.
 * @param {User} user - User whose level should be formatted.
 * @returns {string} Human-readable representation of the user's level.
 */
export function formatUserLevel(user: User): string {
  return formatLevel(user.level);
}

export { UserBadge } from "./UserBadge";
export type { UserBadgeProps } from "./UserBadge";
