import { Exclude } from 'class-transformer';
import type {
  Session,
  SessionAccessRequest,
  SessionParticipant,
} from '../../../prisma/generated/client.ts';
import {
  SessionAccess,
  SessionAccessRequestStatus,
  SessionParticipantRole,
  SessionStatus,
  SessionType,
} from '../../../prisma/generated/enums.ts';
import type { SessionUserSummary } from '../sessions.types.ts';

export class SessionParticipantEntity implements SessionParticipant {
  userId!: string;
  sessionId!: string;
  role!: SessionParticipantRole;
  joinedAt!: Date | null;
  leftAt!: Date | null;
  reconnectCount!: number;
  offlineSeconds!: number;
  createdAt!: Date;
  updatedAt!: Date;
  user?: SessionUserSummary;

  constructor(
    partial: Partial<SessionParticipant> & { user?: SessionUserSummary },
  ) {
    Object.assign(this, partial);
  }
}

export class SessionEntity implements Session {
  id!: string;
  ownerId!: string;
  type!: SessionType;
  access!: SessionAccess;
  status!: SessionStatus;
  statusUpdatedAt!: Date;
  scheduledAt!: Date | null;
  startedAt!: Date | null;
  endedAt!: Date | null;
  livekitRoomName!: string;
  createdAt!: Date;
  updatedAt!: Date;

  @Exclude()
  passwordHash!: string | null;

  constructor(partial: Partial<Session>) {
    Object.assign(this, partial);
  }
}

export class SessionParticipantsResponse {
  sessionId!: string;
  count!: number;
  participants!: SessionParticipantEntity[];

  constructor(partial: SessionParticipantsResponse) {
    Object.assign(this, partial);
  }
}

/**
 * Завершённая сессия в истории пользователя: его роль и остальные участники
 */
export class SessionHistoryItemResponse {
  id!: string;
  type!: SessionType;
  startedAt!: Date | null;
  endedAt!: Date | null;
  myRole!: SessionParticipantRole;
  partners!: SessionParticipantEntity[];

  constructor(partial: SessionHistoryItemResponse) {
    Object.assign(this, partial);
  }
}

export class SessionAccessRequestEntity implements SessionAccessRequest {
  id!: string;
  sessionId!: string;
  requesterId!: string;
  status!: SessionAccessRequestStatus;
  requestedRole!: SessionParticipantRole;
  reviewedById!: string | null;
  reviewedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  requester?: SessionUserSummary;

  constructor(
    partial: Partial<SessionAccessRequest> & { requester?: SessionUserSummary },
  ) {
    Object.assign(this, partial);
  }
}

/**
 * Состояние текущего пользователя относительно комнаты: по нему фронт решает,
 * показать комнату, форму заявки, ожидание одобрения или отказ.
 */
export class MySessionStateResponse {
  userId!: string;
  isOwner!: boolean;
  sessionStatus!: SessionStatus;
  access!: SessionAccess;
  role!: SessionParticipantRole | null;
  accessRequestStatus!: SessionAccessRequestStatus | null;

  constructor(partial: MySessionStateResponse) {
    Object.assign(this, partial);
  }
}

export class LivekitTokenResponse {
  serverUrl!: string;
  roomName!: string;
  token!: string;

  constructor(partial: LivekitTokenResponse) {
    Object.assign(this, partial);
  }
}
