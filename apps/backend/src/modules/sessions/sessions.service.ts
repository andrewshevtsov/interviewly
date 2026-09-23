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
import {
  LivekitTokenResponse,
  SessionAccessRequestEntity,
  SessionEntity,
  SessionParticipantEntity,
  SessionParticipantsResponse,
} from './entities/session.entity.ts';
import { SESSION_PERMISSIONS, roleAllowed } from './sessions.permissions.ts';
import { SessionsRepository } from './sessions.repository.ts';

const PASSWORD_SALT_ROUNDS = 12;

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
      type: dto.type,
      access,
      passwordHash,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      owner: { connect: { id: ownerId } },
      participants: {
        create: [
          {
            userId: ownerId,
            role: SessionParticipantRole.HOST,
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

  async listParticipants(
    sessionId: string,
    actor: JwtPayload,
  ): Promise<SessionParticipantsResponse> {
    await this.requireSession(sessionId);
    await this.assertCanViewParticipants(sessionId, actor);

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
        'Invite-only session: wait for an invitation or ask the host to add you',
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
    if (requestedRole === SessionParticipantRole.HOST) {
      throw new BadRequestException('Cannot request HOST role');
    }

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
    await this.requireSession(sessionId);
    await this.assertCanManageAccessRequests(sessionId, actor);

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
    await this.requireSession(sessionId);
    await this.assertCanManageAccessRequests(sessionId, actor);

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
    await this.requireSession(sessionId);
    await this.assertCanManageAccessRequests(sessionId, actor);

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
        'Not a participant: submit an access request and wait for host approval',
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

    if (
      SESSION_PERMISSIONS.singleActiveRoom.enabled &&
      roleAllowed(
        SESSION_PERMISSIONS.singleActiveRoom.enforceForRoles,
        participant.role,
      )
    ) {
      await this.disconnectFromOtherRooms(userId, sessionId);
    }

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
        'Not a participant: submit an access request and wait for host approval',
      );
    }

    if (
      SESSION_PERMISSIONS.singleActiveRoom.enabled &&
      roleAllowed(
        SESSION_PERMISSIONS.singleActiveRoom.enforceForRoles,
        participant.role,
      )
    ) {
      await this.disconnectFromOtherRooms(userId, sessionId);
    }

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

  private async disconnectFromOtherRooms(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    const enforceRoles =
      SESSION_PERMISSIONS.singleActiveRoom.enforceForRoles;

    const active = await this.sessionsRepository.findActiveParticipations(
      userId,
      currentSessionId,
    );

    // HOST-участия в других комнатах не трогаем.
    const toLeave = active.filter((participation) =>
      roleAllowed(enforceRoles, participation.role),
    );

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
    sessionId: string,
    actor: JwtPayload,
  ): Promise<void> {
    const perm = SESSION_PERMISSIONS.viewParticipants;
    if (perm.allowAdmin && actor.isAdmin) {
      return;
    }

    const participant = await this.sessionsRepository.findParticipant(
      sessionId,
      actor.sub,
    );
    if (participant && roleAllowed(perm.allowRoles, participant.role)) {
      return;
    }

    throw new ForbiddenException(
      'Only the host or participants of this room can view the participant list',
    );
  }

  private async assertCanManageAccessRequests(
    sessionId: string,
    actor: JwtPayload,
  ): Promise<void> {
    const perm = SESSION_PERMISSIONS.manageAccessRequests;
    if (perm.allowAdmin && actor.isAdmin) {
      return;
    }

    const participant = await this.sessionsRepository.findParticipant(
      sessionId,
      actor.sub,
    );
    if (participant && roleAllowed(perm.allowRoles, participant.role)) {
      return;
    }

    throw new ForbiddenException('Only the room host can manage access requests');
  }
}
