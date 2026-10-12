// Слой entities: бизнес-сущность "отклик на карточку витрины" - роль, время встречи и решение владельца.
// Разрешено импортировать из shared.

/**
 * Роль в мок-интервью. Откликающийся выбирает свою, владелец карточки получает противоположную.
 */
export type ShowcaseRole = "INTERVIEWER" | "CANDIDATE";

/**
 * Статус отклика.
 */
export type ShowcaseResponseStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

/**
 * Статус сессии, созданной при принятии отклика.
 */
export type MatchSessionStatus = "DRAFT" | "SCHEDULED" | "READY" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

/**
 * Сообщение в чате по отклику.
 */
export interface ChatMessage {
  /**
   * Идентификатор сообщения.
   */
  id: string;

  /**
   * Текст сообщения.
   */
  text: string;

  /**
   * Когда отправлено, ISO.
   */
  createdAt: string;

  /**
   * Сообщение написал я.
   */
  mine: boolean;
}

/**
 * Непрочитанные сообщения собеседника по одному отклику.
 */
export interface UnreadMessages {
  /**
   * Отклик, по которому есть непрочитанное.
   */
  responseId: string;

  /**
   * Сколько сообщений собеседника новее последнего открытия чата.
   */
  count: number;

  /**
   * `incoming` - я владелец карточки, `outgoing` - я откликался.
   */
  box: "incoming" | "outgoing";
}

/**
 * Данные для отклика на карточку.
 */
export interface RespondInput {
  /**
   * Роль откликающегося во встрече.
   */
  role: ShowcaseRole;

  /**
   * Предлагаемое начало встречи, ISO-8601 с часовым поясом.
   */
  scheduledAt: string;
}

/**
 * Данные для отказа на отклик.
 */
export interface RejectInput {
  /**
   * Причина отказа, 30-500 символов (длина считается без пробелов по краям).
   */
  reason: string;

  /**
   * Отказ только из-за времени: пауза перед повторным откликом не действует.
   */
  timeMismatch: boolean;
}

/**
 * Результат действия с откликом: создание, принятие, отказ, отзыв.
 */
export interface ResponseResult {
  /**
   * Идентификатор отклика.
   */
  id: string;

  /**
   * Статус после действия.
   */
  status: ShowcaseResponseStatus;

  /**
   * Роль откликнувшегося.
   */
  role: ShowcaseRole;

  /**
   * Время встречи, ISO.
   */
  scheduledAt: string;

  /**
   * Когда бот пришлёт обоим ссылку на комнату (за 2 часа до встречи), ISO.
   */
  reminderAt: string;

  /**
   * Созданная при принятии сессия; иначе `null`.
   */
  sessionId: string | null;
}

/**
 * Кто откликнулся, как его видит владелец карточки.
 */
export interface ResponderSummary {
  /**
   * Имя и фамилия.
   */
  name: string;

  /**
   * Должность из профиля.
   */
  title: string | null;

  /**
   * Уровень из профиля.
   */
  level: string | null;

  /**
   * Стек из профиля.
   */
  stack: string[];

  /**
   * О себе из профиля.
   */
  bio: string | null;
}

/**
 * Общие поля любого отклика в списках.
 */
interface ResponseBase {
  /**
   * Идентификатор отклика.
   */
  id: string;

  /**
   * Текущий статус.
   */
  status: ShowcaseResponseStatus;

  /**
   * Роль откликнувшегося.
   */
  role: ShowcaseRole;

  /**
   * Время встречи, ISO.
   */
  scheduledAt: string;

  /**
   * Сессия, созданная при принятии; иначе `null`.
   */
  sessionId: string | null;

  /**
   * Статус этой сессии: по нему видно, что встречу отменили; без сессии - `null`.
   */
  sessionStatus: MatchSessionStatus | null;

  /**
   * Когда отклик создан, ISO.
   */
  createdAt: string;

  /**
   * Когда принят решение (или отзыв), ISO; иначе `null`.
   */
  reviewedAt: string | null;

  /**
   * Причина отказа; иначе `null`.
   */
  rejectionReason: string | null;

  /**
   * Отказ был только из-за времени.
   */
  timeMismatch: boolean;
}

/**
 * Отклик на мою карточку (вид владельца).
 */
export interface IncomingResponse extends ResponseBase {
  /**
   * Роль, в которой на встрече окажется владелец карточки.
   */
  ownerRole: ShowcaseRole;

  /**
   * Кто откликнулся: без контактов.
   */
  responder: ResponderSummary;
}

/**
 * Карточка, на которую я откликнулся.
 */
export interface OutgoingCardSummary {
  /**
   * Идентификатор карточки.
   */
  id: string;

  /**
   * Имя владельца.
   */
  name: string;

  /**
   * Должность владельца.
   */
  title: string;
}

/**
 * Мой отклик на чужую карточку (вид откликнувшегося).
 */
export interface OutgoingResponse extends ResponseBase {
  /**
   * Карточка, на которую подан отклик.
   */
  card: OutgoingCardSummary;

  /**
   * После отказа не из-за времени: когда можно откликнуться на эту карточку снова, ISO.
   */
  canRetryAt: string | null;
}

export { showcaseResponseApi, showcaseResponseKeys } from "./showcase-response-api";
export { ResponseStatusBadge } from "./ResponseStatusBadge";
export {
  DATETIME_LOCAL_LENGTH,
  getSlotBounds,
  isReasonLengthValid,
  isSlotAllowed,
  localValueToIso,
  MESSAGE_MAX_LENGTH,
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
  toDateTimeLocalValue,
} from "./response-rules";
export type { SlotBounds } from "./response-rules";
export { classifyRespondError, classifyReviewError } from "./response-errors";
export type { RespondError, RespondErrorKey, ReviewErrorKey } from "./response-errors";
export { ROLE_LABEL_KEYS } from "./role-label-keys";
export { useUnreadMessages } from "./use-unread-messages";
