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

  constructor(partial: Partial<SessionParticipant>) {
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

  constructor(partial: Partial<SessionAccessRequest>) {
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
