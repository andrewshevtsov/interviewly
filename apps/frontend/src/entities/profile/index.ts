// Слой entities: сущность "профиль пользователя" - редактируемые данные профиля и статистика.
// Разрешено импортировать из shared.

/**
 * A user's experience level, matching the toggle in the profile form.
 */
export type ProfileLevel = "junior" | "middle" | "senior";

/**
 * The signed-in user's editable profile, shown on the "Личный кабинет" screen.
 */
export interface Profile {
  /**
   * Full name.
   */
  name: string;

  /**
   * Role/title, e.g. "Senior Frontend Engineer".
   */
  role: string;

  /**
   * Contact email.
   */
  email: string;

  /**
   * Telegram handle, e.g. "@artem_dev".
   */
  telegram: string;

  /**
   * Experience level.
   */
  level: ProfileLevel;

  /**
   * Technologies shown on the user's public card.
   */
  stack: string[];

  /**
   * Free-form bio text shown on the user's public card.
   */
  bio: string;
}

/**
 * Blank profile shown while a signed-in user hasn't filled in their profile yet.
 */
export const EMPTY_PROFILE: Profile = {
  name: "",
  role: "",
  email: "",
  telegram: "",
  level: "middle",
  stack: [],
  bio: "",
};

/**
 * The signed-in user's aggregate stats, shown in the profile sidebar.
 */
export interface ProfileStatsData {
  /**
   * Number of interviews conducted, formatted for display (e.g. "81").
   */
  interviews: string;

  /**
   * Average rating, formatted for display (e.g. "9.4").
   */
  avgRating: string;

  /**
   * Leaderboard rank, formatted for display (e.g. "04").
   */
  topRank: string;
}

export { profileApi } from "./profile-api";
