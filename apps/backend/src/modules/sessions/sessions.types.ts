import type {
  Session,
  SessionParticipant,
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
