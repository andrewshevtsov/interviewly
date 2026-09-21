import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type {
  Prisma,
  Session,
  SessionAccessRequest,
  SessionParticipant,
} from '../../prisma/generated/client.ts';
import {
  SessionAccessRequestStatus,
  SessionParticipantRole,
} from '../../prisma/generated/enums.ts';
import type {
  SessionWithParticipants,
  UpdateAccessRequestData,
} from './sessions.types.ts';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  findManyForUser(params: {
    userId: string;
    isAdmin: boolean;
  }): Promise<Session[]> {
    if (params.isAdmin) {
      return this.prisma.session.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.session.findMany({
      where: {
        OR: [
          { ownerId: params.userId },
          { participants: { some: { userId: params.userId } } },
          {
            accessRequests: {
              some: {
                requesterId: params.userId,
                status: SessionAccessRequestStatus.PENDING,
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  findByIdWithParticipants(
    id: string,
  ): Promise<SessionWithParticipants | null> {
    return this.prisma.session.findUnique({
      where: { id },
      include: { participants: true },
    });
  }

  findParticipant(
    sessionId: string,
    userId: string,
  ): Promise<SessionParticipant | null> {
    return this.prisma.sessionParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });
  }

  listParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return this.prisma.sessionParticipant.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  countParticipants(sessionId: string): Promise<number> {
    return this.prisma.sessionParticipant.count({ where: { sessionId } });
  }

  upsertParticipant(params: {
    sessionId: string;
    userId: string;
    role: SessionParticipantRole;
    joinedAt?: Date | null;
  }): Promise<SessionParticipant> {
    const { sessionId, userId, role, joinedAt } = params;

    return this.prisma.sessionParticipant.upsert({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      create: {
        sessionId,
        userId,
        role,
        joinedAt: joinedAt ?? new Date(),
      },
      update: {
        role,
        leftAt: null,
        joinedAt: joinedAt ?? new Date(),
        reconnectCount: { increment: 1 },
      },
    });
  }

  findActiveParticipations(
    userId: string,
    excludeSessionId?: string,
  ): Promise<
    Array<SessionParticipant & { session: Pick<Session, 'id' | 'livekitRoomName'> }>
  > {
    return this.prisma.sessionParticipant.findMany({
      where: {
        userId,
        leftAt: null,
        joinedAt: { not: null },
        ...(excludeSessionId
          ? { sessionId: { not: excludeSessionId } }
          : {}),
      },
      include: {
        session: { select: { id: true, livekitRoomName: true } },
      },
    });
  }

  markLeft(sessionId: string, userId: string): Promise<SessionParticipant> {
    return this.prisma.sessionParticipant.update({
      where: { userId_sessionId: { userId, sessionId } },
      data: { leftAt: new Date() },
    });
  }

  findPendingAccessRequest(
    sessionId: string,
    requesterId: string,
  ): Promise<SessionAccessRequest | null> {
    return this.prisma.sessionAccessRequest.findFirst({
      where: {
        sessionId,
        requesterId,
        status: SessionAccessRequestStatus.PENDING,
      },
    });
  }

  createAccessRequest(params: {
    sessionId: string;
    requesterId: string;
    requestedRole: SessionParticipantRole;
  }): Promise<SessionAccessRequest> {
    return this.prisma.sessionAccessRequest.create({
      data: {
        sessionId: params.sessionId,
        requesterId: params.requesterId,
        requestedRole: params.requestedRole,
        status: SessionAccessRequestStatus.PENDING,
      },
    });
  }

  listAccessRequests(
    sessionId: string,
    status?: SessionAccessRequestStatus,
  ): Promise<SessionAccessRequest[]> {
    return this.prisma.sessionAccessRequest.findMany({
      where: {
        sessionId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAccessRequestById(
    id: string,
  ): Promise<SessionAccessRequest | null> {
    return this.prisma.sessionAccessRequest.findUnique({ where: { id } });
  }

  updateAccessRequest(
    id: string,
    data: UpdateAccessRequestData,
  ): Promise<SessionAccessRequest> {
    return this.prisma.sessionAccessRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewedAt: data.reviewedAt,
        reviewedById: data.reviewedById,
      },
    });
  }

  hasPendingOrApprovedRequest(
    sessionId: string,
    requesterId: string,
  ): Promise<boolean> {
    return this.prisma.sessionAccessRequest
      .count({
        where: {
          sessionId,
          requesterId,
          status: {
            in: [
              SessionAccessRequestStatus.PENDING,
              SessionAccessRequestStatus.APPROVED,
            ],
          },
        },
      })
      .then((count) => count > 0);
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
