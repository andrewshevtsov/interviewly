import type {
  Feedback,
  Session,
  SessionAccessRequest,
  SessionParticipant,
  User,
} from '../../prisma/generated/client.ts';
import type { SessionAccessRequestStatus } from '../../prisma/generated/enums.ts';

export type SessionWithParticipants = Session & {
  participants: SessionParticipant[];
};

export type UpdateAccessRequestData = {
  status: SessionAccessRequestStatus;
  reviewedAt: Date;
  reviewedById: string;
};

/** Публичные поля пользователя, которые можно показать другим участникам комнаты. */
export type SessionUserSummary = Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;

export type ParticipantWithUser = SessionParticipant & { user: SessionUserSummary };

export type AccessRequestWithRequester = SessionAccessRequest & {
  requester: SessionUserSummary;
};

/**
 * Завершённая сессия с участниками (для определения партнёра и своей роли) и
 * своими отзывами (для оценки) — источник для экрана "История интервью".
 */
export type CompletedSessionForHistory = Session & {
  participants: ParticipantWithUser[];
  feedback: Feedback[];
};
