// Слой entities: описывает бизнес-сущность "сессия интервью".
// Разрешено импортировать из shared.
import { formatLevel } from "@/shared/lib/format-level";

/**
 * Одна сессия интервью.
 */
export interface InterviewSession {
  /**
   * Уникальный идентификатор сессии.
   */
  id: string;

  /**
   * Название сессии для людей.
   */
  title: string;

  /**
   * Текущий этап жизненного цикла сессии.
   */
  status: "scheduled" | "active" | "completed";
}

/**
 * Роль текущего пользователя в прошедшей сессии, показывается на экране "История".
 */
export type SessionParticipantRole = "candidate" | "interviewer";

/**
 * Запись о завершённой сессии интервью на экране "История интервью".
 */
export interface SessionHistoryEntry {
  /**
   * Уникальный идентификатор сессии.
   */
  id: string;

  /**
   * Короткий код для отображения, например "4092" (выводится как "#4092").
   */
  number: string;

  /**
   * Роль текущего пользователя в этой сессии.
   */
  role: SessionParticipantRole;

  /**
   * Название сессии, например "Алгоритмы: связные списки".
   */
  title: string;

  /**
   * Отображаемое имя второго участника.
   */
  partnerName: string;

  /**
   * Дата сессии в формате для отображения (например, "18 августа 2026").
   */
  date: string;

  /**
   * Длительность сессии в формате для отображения (например, "48 мин").
   */
  duration: string;

  /**
   * Сколько AI-подсказок использовано за сессию.
   */
  hintsUsed: number;

  /**
   * Сколько AI-подсказок доступно в сессии.
   */
  hintsTotal: number;

  /**
   * Оценка за сессию.
   */
  score: number;

  /**
   * Максимально возможная оценка.
   */
  scoreMax: number;
}

/**
 * Подсказка, которую AI дал во время сессии.
 */
export interface SessionHint {
  /**
   * Время от начала сессии, когда была запрошена подсказка, например "12:40".
   */
  at: string;

  /**
   * Текст подсказки.
   */
  text: string;
}

/**
 * Один момент хронологии сессии.
 */
export interface SessionTimelineEvent {
  /**
   * Время от начала сессии, например "05:30".
   */
  at: string;

  /**
   * Что произошло.
   */
  text: string;
}

/**
 * Всё, что показывается о прошедшем интервью на его экране: запись истории плюс
 * задача, итоговый код, подсказки, хронология и AI-резюме.
 */
export interface SessionDetails extends SessionHistoryEntry {
  /**
   * Название задачи, которую решали на интервью.
   */
  taskTitle: string;

  /**
   * Условие задачи.
   */
  taskDescription: string;

  /**
   * Темы, затронутые на интервью.
   */
  topics: string[];

  /**
   * Отображаемое название языка итогового кода, например "Python".
   */
  codeLanguage: string;

  /**
   * Код на момент завершения интервью.
   */
  finalCode: string;

  /**
   * Подсказки, запрошенные во время интервью, по порядку.
   */
  hints: SessionHint[];

  /**
   * Ключевые моменты интервью, по порядку.
   */
  timeline: SessionTimelineEvent[];

  /**
   * Сколько раз запускали код.
   */
  codeRuns: number;

  /**
   * Сколько раз текущий пользователь терял и восстанавливал соединение.
   */
  reconnects: number;

  /**
   * Что получилось хорошо, по итогам AI.
   */
  strengths: string[];

  /**
   * Что улучшить, по итогам AI.
   */
  growthAreas: string[];
}

/**
 * Человек, участвовавший в прошедшем интервью, и его роль в нём.
 */
export interface PastSessionParticipant {
  /**
   * Email аккаунта - то, что идентифицирует участника среди пользователей.
   */
  email: string;

  /**
   * Отображаемое имя.
   */
  name: string;

  /**
   * Роль, которую участник играл в интервью.
   */
  role: SessionParticipantRole;

  /**
   * Сколько раз этот участник терял и восстанавливал соединение.
   */
  reconnects: number;
}

/**
 * Прошедшее интервью как оно есть, одинаковое для всех: в отличие от {@link SessionDetails},
 * здесь ничего не зависит от того, кто смотрит - роль, партнёр и переподключения смотрящего
 * вычисляются из `participants` функцией {@link getSessionDetailsFor}.
 */
export interface PastSession extends Omit<SessionDetails, "role" | "partnerName" | "reconnects"> {
  /**
   * Все, кто участвовал в интервью.
   */
  participants: PastSessionParticipant[];
}

/**
 * Описывает прошедшее интервью с точки зрения участника: его роль, его партнёр
 * и его собственные переподключения.
 * @param {PastSession} session - прошедшее интервью.
 * @param {string} viewerEmail - email аккаунта текущего пользователя.
 * @returns {SessionDetails | null} Интервью с точки зрения смотрящего, либо `null`, если он не участвовал.
 */
export function getSessionDetailsFor(session: PastSession, viewerEmail: string): SessionDetails | null {
  const viewer = session.participants.find((participant) => participant.email === viewerEmail);
  const partner = session.participants.find((participant) => participant.email !== viewerEmail);

  if (!viewer || !partner) {
    return null;
  }

  return { ...session, role: viewer.role, partnerName: partner.name, reconnects: viewer.reconnects };
}

/**
 * Возвращает прошедшие интервью, в которых участвовал пользователь, в порядке `sessions`.
 * @param {PastSession[]} sessions - все прошедшие интервью, сначала новые.
 * @param {string} viewerEmail - email аккаунта текущего пользователя.
 * @returns {SessionDetails[]} Собственные интервью пользователя, каждое с его точки зрения.
 */
export function getSessionHistoryFor(sessions: PastSession[], viewerEmail: string): SessionDetails[] {
  return sessions.flatMap((session) => getSessionDetailsFor(session, viewerEmail) ?? []);
}

/**
 * Участник на экране "Открытая сессия".
 */
export interface SessionParticipant {
  /**
   * Отображаемое имя.
   */
  name: string;

  /**
   * Роль участника в этой сессии.
   */
  role: SessionParticipantRole;
}

/**
 * Язык редактора кода, предлагаемый при создании сессии.
 */
export type EditorLanguage = "python" | "javascript";

/**
 * Черновые значения формы создания "Новая сессия".
 */
export interface NewSessionDraft {
  /**
   * Название сессии.
   */
  title: string;

  /**
   * Язык редактора кода в сессии.
   */
  editorLanguage: EditorLanguage;

  /**
   * Нужен ли для входа в сессию код доступа ниже.
   */
  isPrivate: boolean;

  /**
   * Код доступа, обязательный для входа при `isPrivate`.
   */
  accessCode: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Проверяет, что строка - корректный идентификатор сессии (на бэкенде id сессий - UUID).
 * @param {string} id - Проверяемый идентификатор сессии.
 * @returns {boolean} `true`, если `id` - UUID.
 */
export function isValidSessionId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

/**
 * Форматирует уровень сессии для отображения.
 * @param {string} level - Исходный уровень, например "junior", "middle", "senior".
 * @returns {string} Уровень в читаемом виде.
 */
export function describeSessionLevel(level: string): string {
  return formatLevel(level);
}

/**
 * Кто может попасть в сессию: по одобрению владельца, по одобрению и паролю или только по приглашению.
 */
export type SessionAccess = "OPEN" | "PASSWORD" | "INVITE";

/**
 * Этап жизненного цикла сессии в том виде, как он хранится на бэкенде.
 */
export type SessionStatus = "DRAFT" | "SCHEDULED" | "READY" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

/**
 * Роль участника в том виде, как она хранится на бэкенде. Владелец сессии входит как интервьюер.
 */
export type ApiSessionRole = "INTERVIEWER" | "CANDIDATE";

/**
 * Состояние заявки на вход в сессию.
 */
export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Сессия в ответе бэкенда (без участников и пароля).
 */
export interface ApiSession {
  /**
   * UUID сессии.
   */
  id: string;

  /**
   * UUID пользователя, создавшего сессию.
   */
  ownerId: string;

  /**
   * Кто может попасть в сессию.
   */
  access: SessionAccess;

  /**
   * Этап жизненного цикла.
   */
  status: SessionStatus;
}

/**
 * Тело запроса `POST /sessions`.
 */
export interface CreateSessionInput {
  /**
   * Кто может попасть в сессию.
   */
  access: SessionAccess;

  /**
   * Пароль комнаты, обязателен при `access` = `"PASSWORD"`.
   */
  password?: string;
}

/**
 * Публичные поля пользователя, которые видят другие люди в комнате.
 */
export interface SessionUserSummary {
  /**
   * UUID пользователя.
   */
  id: string;

  /**
   * Имя.
   */
  firstName: string;

  /**
   * Фамилия, если указана.
   */
  lastName: string | null;

  /**
   * Email аккаунта.
   */
  email: string;
}

/**
 * Положение текущего пользователя в сессии - определяет, какой экран покажет комната.
 */
export interface MySessionState {
  /**
   * UUID текущего пользователя.
   */
  userId: string;

  /**
   * Является ли пользователь владельцем сессии - владелец впускает участников.
   */
  isOwner: boolean;

  /**
   * Этап жизненного цикла сессии.
   */
  sessionStatus: SessionStatus;

  /**
   * Кто может попасть в сессию (отсюда видно, нужен ли пароль).
   */
  access: SessionAccess;

  /**
   * Роль пользователя или `null`, если он ещё не участник.
   */
  role: ApiSessionRole | null;

  /**
   * Состояние последней заявки пользователя или `null`, если он её не подавал.
   */
  accessRequestStatus: AccessRequestStatus | null;
}

/**
 * Заявка на вход в сессию глазами её владельца.
 */
export interface AccessRequest {
  /**
   * UUID заявки.
   */
  id: string;

  /**
   * Состояние заявки.
   */
  status: AccessRequestStatus;

  /**
   * Роль, которую автор заявки получит после одобрения.
   */
  requestedRole: ApiSessionRole;

  /**
   * Кто подал заявку.
   */
  requester: SessionUserSummary;
}

/**
 * Человек, впущенный в сессию, как его возвращает `GET /sessions/:id/participants`.
 */
export interface ApiSessionParticipant {
  /**
   * UUID пользователя.
   */
  userId: string;

  /**
   * Роль участника.
   */
  role: ApiSessionRole;

  /**
   * Кто этот участник.
   */
  user: SessionUserSummary;
}

/**
 * Что нужно клиенту LiveKit для подключения к комнате сессии.
 */
export interface LivekitConnection {
  /**
   * URL сигналинга LiveKit, например "ws://localhost:7880".
   */
  serverUrl: string;

  /**
   * Имя комнаты LiveKit.
   */
  roomName: string;

  /**
   * JWT участника для этой комнаты.
   */
  token: string;
}

const CLOSED_SESSION_STATUSES: ReadonlySet<SessionStatus> = new Set(["COMPLETED", "CANCELLED", "EXPIRED"]);

/**
 * Проверяет, что в сессию больше нельзя войти.
 * @param {SessionStatus} status - Этап жизненного цикла сессии.
 * @returns {boolean} `true`, если сессия завершена, отменена или истекла.
 */
export function isSessionClosed(status: SessionStatus): boolean {
  return CLOSED_SESSION_STATUSES.has(status);
}

/**
 * Переводит роль с бэкенда в роль для интерфейса.
 * @param {ApiSessionRole} role - Роль в том виде, как она хранится на бэкенде.
 * @returns {SessionParticipantRole} Роль для интерфейса.
 */
export function toParticipantRole(role: ApiSessionRole): SessionParticipantRole {
  return role === "CANDIDATE" ? "candidate" : "interviewer";
}

/**
 * Отображаемое имя пользователя: "Имя Фамилия" или только имя.
 * @param {SessionUserSummary} user - Пользователь.
 * @returns {string} Имя для отображения.
 */
export function formatUserName(user: SessionUserSummary): string {
  return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
}

export { sessionApi } from "./session-api";
