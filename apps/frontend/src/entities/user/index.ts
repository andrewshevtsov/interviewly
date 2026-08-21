// Слой entities: сущность "пользователь". Импортирует только shared.
import {formatLevel} from "@/shared/lib/format-level";

/**
 *
 */
export interface User {

  /**
   *
   */
  id: string;

  /**
   *
   */
  displayName: string;

  /**
   *
   */
  stack: string[];

  /**
   *
   */
  level: string;
}

/**
 *
 * @param user
 */
export function formatUserLevel(user: User): string {
  return formatLevel(user.level);
}
