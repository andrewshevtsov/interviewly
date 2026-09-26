import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { LivekitService } from '../../infrastructure/livekit/livekit.service.ts';
import {
  SessionAccess,
  SessionAccessRequestStatus,
  SessionParticipantRole,
  SessionStatus,
} from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { CreateAccessRequestDto } from './dto/create-access-request.dto.ts';
import { CreateSessionDto } from './dto/create-session.dto.ts';
import { JoinSessionDto } from './dto/join-session.dto.ts';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto.ts';
import {
  LivekitTokenResponse,
  MySessionStateResponse,
  SessionAccessRequestEntity,
  SessionEntity,
  SessionHistoryEntryResponse,
  SessionParticipantEntity,
  SessionParticipantsResponse,
} from './entities/session.entity.ts';
import { SESSION_PERMISSIONS } from './sessions.permissions.ts';
import { SessionsRepository } from './sessions.repository.ts';
import type { CompletedSessionForHistory } from './sessions.types.ts';

const PASSWORD_SALT_ROUNDS = 12;

// Максимальная оценка по шкале отзывов (CreateFeedbackDto.score: 0-10).
const FEEDBACK_SCORE_MAX = 10;

const MS_PER_MINUTE = 60_000;

/**
 * Короткий 4-значный код для отображения (например "#4092"), выводится из UUID
 * сессии — стабилен без отдельного столбца-счётчика в базе.
 * @param {string} sessionId - UUID сессии.
 * @returns {string} 4-значный код.
 */
function deriveDisplayNumber(sessionId: string): string {
  const hex = sessionId.replace(/-/g, '').slice(0, 8);
  const NUMBER_RANGE = 10000;
  return String(parseInt(hex, 16) % NUMBER_RANGE).padStart(4, '0');
}

/**
 * Отображаемое имя пользователя: имя и фамилия, если она указана.
 * @param {{ firstName: string; lastName: string | null }} user - Пользователь.
 * @returns {string} Имя для отображения.
 */
function formatUserName(user: { firstName: string; lastName: string | null }): string {
  return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
}

/**
 * Превращает завершённую сессию в строку "Истории интервью" для конкретного пользователя.
 * @param {CompletedSessionForHistory} session - Сессия с участниками и своими отзывами.
 * @param {string} userId - UUID текущего пользователя.
 * @returns {SessionHistoryEntryResponse} Строка истории.
 */
function toHistoryEntry(
  session: CompletedSessionForHistory,
  userId: string,
): SessionHistoryEntryResponse {
  const mine = session.participants.find((participant) => participant.userId === userId);
  const partner = session.participants.find((participant) => participant.userId !== userId);
  const feedback = session.feedback[0];

  const durationMinutes =
    session.startedAt && session.endedAt
      ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / MS_PER_MINUTE)
      : 0;

  return new SessionHistoryEntryResponse({
    id: session.id,
    number: deriveDisplayNumber(session.id),
    role: mine?.role ?? SessionParticipantRole.CANDIDATE,
    title: session.title,
    partnerName: partner ? formatUserName(partner.user) : '',
    date: (session.endedAt ?? session.createdAt).toISOString(),
    durationMinutes,
    score: feedback?.score ?? 0,
    scoreMax: FEEDBACK_SCORE_MAX,
  });
}

const TOKEN_ALLOWED_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.SCHEDULED,
  SessionStatus.READY,
  SessionStatus.ACTIVE,
]);

const CLOSED_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
  SessionStatus.EXPIRED,
]);

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly livekitService: LivekitService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateSessionDto,
  ): Promise<SessionEntity> {
    const access = dto.access ?? SessionAccess.INVITE;

    if (access === SessionAccess.PASSWORD && !dto.password) {
      throw new BadRequestException(
        'password is required when access is PASSWORD',
      );
    }

    const passwordHash =
      access === SessionAccess.PASSWORD && dto.password
        ? await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS)
        : null;

    const id = randomUUID();
    const invited = dto.participants ?? [];

    const session = await this.sessionsRepository.create({
      id,
      livekitRoomName: id,
      title: dto.title?.trim() || null,
      type: dto.type,
      access,
      passwordHash,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      owner: { connect: { id: ownerId } },
      participants: {
        create: [
          {
            userId: ownerId,
            role: SessionParticipantRole.INTERVIEWER,
            joinedAt: null,
          },
          ...invited
            .filter((participant) => participant.userId !== ownerId)
            .map((participant) => ({
              userId: participant.userId,
              role: participant.role ?? SessionParticipantRole.CANDIDATE,
              joinedAt: null,
            })),
        ],
      },
    });

    return new SessionEntity(session);
  }

  async findHistory(userId: string): Promise<SessionHistoryEntryResponse[]> {
    const sessions = await this.sessionsRepository.findCompletedForUser(userId);
    return sessions.map((session) => toHistoryEntry(session, userId));
  }

  async findAll(actor: JwtPayload): Promise<SessionEntity[]> {
    const sessions = await this.sessionsRepository.findManyForUser({
      userId: actor.sub,
      isAdmin:
        actor.isAdmin && SESSION_PERMISSIONS.listAllSessions.allowAdmin,
    });
    return sessions.map((session) => new SessionEntity(session));
  }

  async findOne(id: string, actor: JwtPayload): Promise<SessionEntity> {
    const session = await this.requireSession(id);
    await this.assertCanViewSession(session.id, session.ownerId, actor);
    return new SessionEntity(session);
  }

  /**
   * Только собственные данные вызывающего, поэтому доступно любому авторизованному:
   * так гость по ссылке узнаёт, нужен ли пароль и что с его заявкой.
   */
  async getMyState(
    sessionId: string,
    userId: string,
  ): Promise<MySessionStateResponse> {
    const session = await this.requireSession(sessionId);
    const [participant, latestRequest] = await Promise.all([
      this.sessionsRepository.findParticipant(sessionId, userId),
      this.sessionsRepository.findLatestAccessRequest(sessionId, userId),
    ]);

    return new MySessionStateResponse({
      userId,
      isOwner: session.ownerId === userId,
      sessionStatus: session.status,
      access: session.access,
      role: participant?.role ?? null,
      accessRequestStatus: latestRequest?.status ?? null,
    });
  }

  async listParticipants(
    sessionId: string,
    actor: JwtPayload,
  ): Promise<SessionParticipantsResponse> {
    const session = await this.requireSession(sessionId);
    await this.assertCanViewParticipants(session, actor);

    const [participants, count] = await Promise.all([
      this.sessionsRepository.listParticipants(sessionId),
      this.sessionsRepository.countParticipants(sessionId),
    ]);

    return new SessionParticipantsResponse({
      sessionId,
      count,
      participants: participants.map(
        (participant) => new SessionParticipantEntity(participant),
      ),
    });
  }

  async createAccessRequest(
    sessionId: string,
    actor: JwtPayload,
    dto: CreateAccessRequestDto,
  ): Promise<SessionAccessRequestEntity> {
    const session = await this.requireSession(sessionId);

    if (CLOSED_STATUSES.has(session.status)) {
      throw new ForbiddenException(
        `Session "${sessionId}" is ${session.status.toLowerCase()}`,
      );
    }

    const existingParticipant = await this.sessionsRepository.findParticipant(
      sessionId,
      actor.sub,
    );
    if (existingParticipant) {
      throw new ConflictException('You are already a participant of this session');
    }

    if (session.access === SessionAccess.INVITE) {
      throw new ForbiddenException(
        'Invite-only session: wait for an invitation or ask the owner to add you',
      );
    }

    if (session.access === SessionAccess.PASSWORD) {
      if (!dto.password || !session.passwordHash) {
        throw new UnauthorizedException('Password required');
      }
      const matches = await bcrypt.compare(dto.password, session.passwordHash);
      if (!matches) {
        throw new UnauthorizedException('Invalid session password');
      }
    }

    const pending = await this.sessionsRepository.findPendingAccessRequest(
      sessionId,
      actor.sub,
    );
    if (pending) {
      return new SessionAccessRequestEntity(pending);
    }

    const requestedRole = dto.role ?? SessionParticipantRole.CANDIDATE;

    const created = await this.sessionsRepository.createAccessRequest({
      sessionId,
      requesterId: actor.sub,
      requestedRole,
    });

    return new SessionAccessRequestEntity(created);
  }

  async listAccessRequests(
    sessionId: string,
    actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity[]> {
    const session = await this.requireSession(sessionId);
    this.assertCanManageAccessRequests(session, actor);

    const requests = await this.sessionsRepository.listAccessRequests(sessionId);
    return requests.map(
      (request) => new SessionAccessRequestEntity(request),
    );
  }

  async approveAccessRequest(
    sessionId: string,
    requestId: string,
    actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity> {
    const session = await this.requireSession(sessionId);
    this.assertCanManageAccessRequests(session, actor);

    const request = await this.requireAccessRequest(sessionId, requestId);
    if (request.status !== SessionAccessRequestStatus.PENDING) {
      throw new ConflictException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    const updated = await this.sessionsRepository.updateAccessRequest(
      requestId,
      {
        status: SessionAccessRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: actor.sub,
      },
    );

    await this.sessionsRepository.upsertParticipant({
      sessionId,
      userId: request.requesterId,
      role: request.requestedRole,
      joinedAt: null,
    });

    return new SessionAccessRequestEntity(updated);
  }

  async rejectAccessRequest(
    sessionId: string,
    requestId: string,
    actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity> {
    const session = await this.requireSession(sessionId);
    this.assertCanManageAccessRequests(session, actor);

    const request = await this.requireAccessRequest(sessionId, requestId);
    if (request.status !== SessionAccessRequestStatus.PENDING) {
      throw new ConflictException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    const updated = await this.sessionsRepository.updateAccessRequest(
      requestId,
      {
        status: SessionAccessRequestStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: actor.sub,
      },
    );

    return new SessionAccessRequestEntity(updated);
  }

  /**
   * Передаёт владение комнатой другому интервьюеру: права владельца (заявки, свои комнаты
   * остаются открытыми) вычисляются из ownerId, поэтому переходят сразу. Роли не меняются.
   */
  async transferOwnership(
    sessionId: string,
    actor: JwtPayload,
    dto: TransferOwnershipDto,
  ): Promise<SessionEntity> {
    const session = await this.requireSession(sessionId);
    const rule = SESSION_PERMISSIONS.transferOwnership;

    const isAllowed =
      (rule.allowAdmin && actor.isAdmin) ||
      (rule.allowOwner && session.ownerId === actor.sub);
    if (!isAllowed) {
      throw new ForbiddenException('Only the room owner can transfer ownership');
    }

    if (CLOSED_STATUSES.has(session.status)) {
      throw new ForbiddenException(
        `Session "${sessionId}" is ${session.status.toLowerCase()}`,
      );
    }

    if (dto.userId === session.ownerId) {
      throw new ConflictException('This user already owns the session');
    }

    const target = await this.sessionsRepository.findParticipant(
      sessionId,
      dto.userId,
    );
    const targetRoles: readonly SessionParticipantRole[] = rule.allowTargetRoles;
    if (!target || !targetRoles.includes(target.role)) {
      throw new BadRequestException(
        'Ownership can only be transferred to an interviewer of this session',
      );
    }

    const updated = await this.sessionsRepository.updateOwner(
      sessionId,
      dto.userId,
    );
    return new SessionEntity(updated);
  }

  /**
   * Завершает сессию: COMPLETED + endedAt. Только владелец комнаты (или admin).
   */
  async endSession(sessionId: string, actor: JwtPayload): Promise<SessionEntity> {
    const session = await this.requireSession(sessionId);
    const rule = SESSION_PERMISSIONS.endSession;

    const isAllowed =
      (rule.allowAdmin && actor.isAdmin) ||
      (rule.allowOwner && session.ownerId === actor.sub);
    if (!isAllowed) {
      throw new ForbiddenException('Only the room owner can end the session');
    }

    if (CLOSED_STATUSES.has(session.status)) {
      throw new ForbiddenException(
        `Session "${sessionId}" is already ${session.status.toLowerCase()}`,
      );
    }

    const updated = await this.sessionsRepository.markCompleted(sessionId);
    return new SessionEntity(updated);
  }

  /**
   * Повторный вход уже принятого участника (не заявка).
   */
  async join(
    sessionId: string,
    userId: string,
    dto: JoinSessionDto,
  ): Promise<SessionEntity> {
    const session = await this.requireSession(sessionId);

    if (CLOSED_STATUSES.has(session.status)) {
      throw new ForbiddenException(
        `Session "${sessionId}" is ${session.status.toLowerCase()}`,
      );
    }

    const participant = await this.sessionsRepository.findParticipant(
      sessionId,
      userId,
    );
    if (!participant) {
      throw new ForbiddenException(
        'Not a participant: submit an access request and wait for owner approval',
      );
    }

    if (session.access === SessionAccess.PASSWORD) {
      if (!dto.password || !session.passwordHash) {
        throw new UnauthorizedException('Password required');
      }
      const matches = await bcrypt.compare(dto.password, session.passwordHash);
      if (!matches) {
        throw new UnauthorizedException('Invalid session password');
      }
    }

    await this.leaveOtherRooms(session, userId);

    await this.sessionsRepository.upsertParticipant({
      sessionId,
      userId,
      role: participant.role,
    });

    return new SessionEntity(session);
  }

  async createLivekitToken(
    sessionId: string,
    userId: string,
  ): Promise<LivekitTokenResponse> {
    const session = await this.requireSession(sessionId);

    if (!TOKEN_ALLOWED_STATUSES.has(session.status)) {
      throw new ForbiddenException(
        `LiveKit token is not available for status ${session.status}`,
      );
    }

    const participant = await this.sessionsRepository.findParticipant(
      sessionId,
      userId,
    );
    if (!participant) {
      throw new ForbiddenException(
        'Not a participant: submit an access request and wait for owner approval',
      );
    }

    await this.leaveOtherRooms(session, userId);

    await this.sessionsRepository.upsertParticipant({
      sessionId,
      userId,
      role: participant.role,
    });

    const user = await this.sessionsRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    const displayName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ');

    const token = await this.livekitService.createParticipantToken({
      roomName: session.livekitRoomName,
      identity: userId,
      name: displayName || user.email,
      metadata: JSON.stringify({
        role: participant.role,
        sessionId: session.id,
      }),
    });

    return new LivekitTokenResponse({
      serverUrl: this.livekitService.getServerUrl(),
      roomName: session.livekitRoomName,
      token,
    });
  }

  /**
   * Одна активная комната на участника: при входе в чужую комнату выводит из остальных.
   * Владелец (exemptOwner) держит свои комнаты открытыми и не выкидывается из них.
   */
  private async leaveOtherRooms(
    session: { id: string; ownerId: string },
    userId: string,
  ): Promise<void> {
    const rule = SESSION_PERMISSIONS.singleActiveRoom;
    if (!rule.enabled || (rule.exemptOwner && session.ownerId === userId)) {
      return;
    }

    const active = await this.sessionsRepository.findActiveParticipations(
      userId,
      session.id,
    );
    const toLeave = rule.exemptOwner
      ? active.filter((participation) => participation.session.ownerId !== userId)
      : active;

    await Promise.all(
      toLeave.map(async (participation) => {
        await this.sessionsRepository.markLeft(
          participation.sessionId,
          userId,
        );
        await this.livekitService.removeParticipant(
          participation.session.livekitRoomName,
          userId,
        );
      }),
    );
  }

  private async requireSession(id: string) {
    const session = await this.sessionsRepository.findById(id);
    if (!session) {
      throw new NotFoundException(`Session "${id}" not found`);
    }
    return session;
  }

  private async requireAccessRequest(sessionId: string, requestId: string) {
    const request =
      await this.sessionsRepository.findAccessRequestById(requestId);
    if (!request || request.sessionId !== sessionId) {
      throw new NotFoundException(`Access request "${requestId}" not found`);
    }
    return request;
  }

  private async assertCanViewSession(
    sessionId: string,
    ownerId: string,
    actor: JwtPayload,
  ): Promise<void> {
    const perm = SESSION_PERMISSIONS.viewSession;
    if (perm.allowAdmin && actor.isAdmin) {
      return;
    }
    if (perm.allowOwner && ownerId === actor.sub) {
      return;
    }
    if (perm.allowParticipant) {
      const participant = await this.sessionsRepository.findParticipant(
        sessionId,
        actor.sub,
      );
      if (participant) {
        return;
      }
    }
    if (perm.allowAccessRequester) {
      const hasRequest = await this.sessionsRepository.hasPendingOrApprovedRequest(
        sessionId,
        actor.sub,
      );
      if (hasRequest) {
        return;
      }
    }
    throw new ForbiddenException('No access to this session');
  }

  private async assertCanViewParticipants(
    session: { id: string; ownerId: string },
    actor: JwtPayload,
  ): Promise<void> {
    const perm = SESSION_PERMISSIONS.viewParticipants;
    if (perm.allowAdmin && actor.isAdmin) {
      return;
    }
    if (perm.allowOwner && session.ownerId === actor.sub) {
      return;
    }
    if (perm.allowParticipant) {
      const participant = await this.sessionsRepository.findParticipant(
        session.id,
        actor.sub,
      );
      if (participant) {
        return;
      }
    }

    throw new ForbiddenException(
      'Only the owner or participants of this room can view the participant list',
    );
  }

  private assertCanManageAccessRequests(
    session: { ownerId: string },
    actor: JwtPayload,
  ): void {
    const perm = SESSION_PERMISSIONS.manageAccessRequests;
    if (perm.allowAdmin && actor.isAdmin) {
      return;
    }
    if (perm.allowOwner && session.ownerId === actor.sub) {
      return;
    }

    throw new ForbiddenException('Only the room owner can manage access requests');
  }
}
