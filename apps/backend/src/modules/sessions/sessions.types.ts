import type {
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

export type SessionWithParticipantUsers = Session & {
  participants: ParticipantWithUser[];
};

export type AccessRequestWithRequester = SessionAccessRequest & {
  requester: SessionUserSummary;
};
