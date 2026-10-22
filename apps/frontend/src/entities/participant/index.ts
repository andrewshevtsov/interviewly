// Слой entities: бизнес-сущность "участник" - карточка на "Витрине участников" в том виде,
// как её отдаёт backend (GET /showcase/cards). Разрешено импортировать из shared.

/**
 * Уровень опыта участника.
 */
export type ParticipantLevel = "junior" | "middle" | "senior";

/**
 * Карточка участника на витрине.
 */
export interface Participant {
  /**
   * Идентификатор карточки (профиля).
   */
  id: string;

  /**
   * Имя/фамилия.
   */
  name: string;

  /**
   * Должность.
   */
  role: string;

  /**
   * Уровень опыта.
   */
  level: ParticipantLevel;

  /**
   * Технологии.
   */
  stack: string[];

  /**
   * Текст "о себе".
   */
  bio: string | null;

  /**
   * Сколько интервью участник провёл.
   */
  interviewsCount: number;

  /**
   * Участник сейчас в активной сессии.
   */
  inSession: boolean;

  /**
   * Мой отклик, из-за которого откликнуться пока нельзя.
   */
  myResponse: MyResponse | null;
}

/**
 * Отклик, блокирующий повторный.
 */
export interface MyResponse {
  /**
   * `PENDING` - ждём ответа, `REJECTED` - отклонён, пауза, `ACCEPTED` - встреча назначена.
   */
  status: "PENDING" | "REJECTED" | "ACCEPTED";

  /**
   * Когда пауза после отказа кончится (ISO); для `PENDING` - `null`.
   */
  canRetryAt: string | null;
}

/**
 * Фильтры витрины.
 */
export interface ShowcaseFilters {
  /**
   * Подходит любой из выбранных уровней.
   */
  levels: ParticipantLevel[];

  /**
   * Подходит любая из выбранных технологий.
   */
  stack: string[];

  /**
   * Свободный поиск по имени, роли и тегам стека.
   */
  query: string;
}

/**
 * Страница выдачи витрины.
 */
export interface ParticipantsPage {
  /**
   * Карточки страницы.
   */
  items: Participant[];

  /**
   * Курсор следующей страницы.
   */
  nextCursor: string | null;
}

export { participantApi } from "./participant-api";
export { buildShowcaseParams, SHOWCASE_PAGE_SIZE } from "./showcase-query";
