// Слой entities: описывает бизнес-сущность "строка лидерборда".
// Разрешено импортировать из shared.

/**
 * Строка лидерборда в ответе `GET /leaderboard`.
 */
export interface ApiLeaderboardEntry {
  /**
   * Место в рейтинге, начиная с 1.
   */
  rank: number;

  /**
   * UUID пользователя.
   */
  userId: string;

  /**
   * Имя и фамилия.
   */
  name: string;

  /**
   * Роль из профиля или `null`, если профиля нет.
   */
  role: string | null;

  /**
   * Завершённые интервью.
   */
  interviewsCount: number;
}

/**
 * Строка на экране "Лидерборд"
 */
export interface LeaderboardEntry {
  /**
   * UUID пользователя, ключ строки.
   */
  id: string;

  /**
   * Место для отображения, например "01".
   */
  rank: string;

  /**
   * Имя для отображения.
   */
  name: string;

  /**
   * Роль под именем или `null`, если её нет.
   */
  role: string | null;

  /**
   * Число завершённых интервью, например "12".
   */
  interviewsCount: string;
}

const RANK_DIGITS = 2;

/**
 * Готовит строку ответа API к отображению
 * @param {ApiLeaderboardEntry} entry - Строка из `GET /leaderboard`
 * @returns {LeaderboardEntry} Строка для таблицы
 */
export function toLeaderboardEntry(entry: ApiLeaderboardEntry): LeaderboardEntry {
  return {
    id: entry.userId,
    rank: String(entry.rank).padStart(RANK_DIGITS, "0"),
    name: entry.name,
    role: entry.role,
    interviewsCount: String(entry.interviewsCount),
  };
}

export { getLeaderboard } from "./leaderboard-api";
