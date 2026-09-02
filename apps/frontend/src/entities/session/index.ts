// Слой entities: описывает бизнес-сущность "сессия интервью".
// Разрешено импортировать из shared.
import { formatLevel } from "@/shared/lib/format-level";
import { SESSION_ID_LENGTH } from "@/shared/config/constants";

/**
 * A single interview session.
 */
export interface InterviewSession {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * Human-readable session title.
   */
  title: string;

  /**
   * Current lifecycle state of the session.
   */
  status: "scheduled" | "active" | "completed";
}

/**
 * Checks whether a string is a valid session identifier.
 * @param {string} id - Candidate session identifier.
 * @returns {boolean} `true` if `id` has the expected session ID length.
 */
export function isValidSessionId(id: string): boolean {
  return id.length === SESSION_ID_LENGTH;
}

/**
 * Formats a session's experience level for display.
 * @param {string} level - Raw experience level, e.g. "junior", "middle", "senior".
 * @returns {string} Human-readable representation of the level.
 */
export function describeSessionLevel(level: string): string {
  return formatLevel(level);
}
