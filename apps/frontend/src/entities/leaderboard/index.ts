// Слой entities: описывает бизнес-сущность "строка лидерборда".
// Разрешено импортировать из shared.

/**
 * A single row on the "Лидерборд" screen.
 */
export interface LeaderboardEntry {
  /**
   * Unique id, used as the React key.
   */
  id: string;

  /**
   * Rank, formatted for display (e.g. "01").
   */
  rank: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Role/title shown under the name.
   */
  role: string;

  /**
   * Number of interview sessions conducted, formatted for display (e.g. "142").
   */
  sessionsCount: string;

  /**
   * Average rating, formatted for display (e.g. "9.9").
   */
  rating: string;
}
