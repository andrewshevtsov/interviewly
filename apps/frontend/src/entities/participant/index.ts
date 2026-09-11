// Слой entities: описывает бизнес-сущность "участник" - карточка на "Витрине участников".
// Разрешено импортировать из shared.

/**
 * A participant's experience level.
 */
export type ParticipantLevel = "junior" | "middle" | "senior";

/**
 * A participant's current availability for a mock interview.
 */
export type ParticipantStatus = "available" | "in-session" | "top-rated";

/**
 * A participant card shown on the "Витрина участников" screen.
 */
export interface Participant {
  /**
   * Unique id, used as the React key and route param.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Role/title shown under the name.
   */
  role: string;

  /**
   * Experience level.
   */
  level: ParticipantLevel;

  /**
   * Tech stack tags.
   */
  stack: string[];

  /**
   * Short self-description shown on the card.
   */
  bio: string;

  /**
   * Current availability status.
   */
  status: ParticipantStatus;

  /**
   * Number of interviews conducted, formatted for display (e.g. "42").
   */
  sessionsCount: string;

  /**
   * Average rating, formatted for display (e.g. "9.4/10").
   */
  rating: string;
}
