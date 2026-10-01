import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SessionParticipantRole, SessionStatus } from '../../prisma/generated/enums.ts';
import type { LivekitService } from '../../infrastructure/livekit/livekit.service.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SessionsService } from './sessions.service.ts';
import type { SessionsRepository } from './sessions.repository.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = '22222222-2222-2222-2222-222222222222';
const INTERVIEWER_ID = '33333333-3333-3333-3333-333333333333';
const CANDIDATE_ID = '44444444-4444-4444-4444-444444444444';

const owner: JwtPayload = { sub: OWNER_ID, email: 'owner@test', isAdmin: false };
const session = {
  id: SESSION_ID,
  ownerId: OWNER_ID,
  status: SessionStatus.ACTIVE,
  livekitRoomName: SESSION_ID,
  startedAt: null,
};

function createMockRepository(): Mocked<SessionsRepository> {
  return {
    findById: vi.fn(),
    findParticipant: vi.fn(),
    updateOwner: vi.fn(),
    complete: vi.fn(),
    findCompletedForUser: vi.fn(),
    upsertParticipant: vi.fn(),
    findActiveParticipations: vi.fn(),
    findUserById: vi.fn(),
    countPresentParticipants: vi.fn(),
    markStarted: vi.fn(),
  } as unknown as Mocked<SessionsRepository>;
}

describe('SessionsService', () => {
  let repository: Mocked<SessionsRepository>;
  let livekit: Mocked<LivekitService>;
  let service: SessionsService;

  beforeEach(() => {
    repository = createMockRepository();
    livekit = {
      deleteRoom: vi.fn(),
      createParticipantToken: vi.fn().mockResolvedValue('token'),
      getServerUrl: vi.fn().mockReturnValue('ws://livekit'),
    } as unknown as Mocked<LivekitService>;
    service = new SessionsService(repository, livekit);
    repository.findById.mockResolvedValue(session as never);
  });

  describe('transferOwnership', () => {
    it('передаёт владение другому интервьюеру сессии', async () => {
      repository.findParticipant.mockResolvedValue({ role: SessionParticipantRole.INTERVIEWER } as never);
      repository.updateOwner.mockResolvedValue({ ...session, ownerId: INTERVIEWER_ID } as never);

      const result = await service.transferOwnership(SESSION_ID, owner, { userId: INTERVIEWER_ID });

      expect(repository.updateOwner).toHaveBeenCalledWith(SESSION_ID, INTERVIEWER_ID);
      expect(result.ownerId).toBe(INTERVIEWER_ID);
    });

    it('не даёт передать владение кандидату', async () => {
      repository.findParticipant.mockResolvedValue({ role: SessionParticipantRole.CANDIDATE } as never);

      await expect(
        service.transferOwnership(SESSION_ID, owner, { userId: CANDIDATE_ID }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateOwner).not.toHaveBeenCalled();
    });

    it('не даёт передать владение тому, кто не участвует в сессии', async () => {
      repository.findParticipant.mockResolvedValue(null);

      await expect(
        service.transferOwnership(SESSION_ID, owner, { userId: INTERVIEWER_ID }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('запрещает передачу всем, кроме владельца и админа', async () => {
      const interviewer: JwtPayload = { sub: INTERVIEWER_ID, email: 'i@test', isAdmin: false };

      await expect(
        service.transferOwnership(SESSION_ID, interviewer, { userId: INTERVIEWER_ID }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateOwner).not.toHaveBeenCalled();
    });

    it('разрешает передачу админу', async () => {
      const admin: JwtPayload = { sub: CANDIDATE_ID, email: 'a@test', isAdmin: true };
      repository.findParticipant.mockResolvedValue({ role: SessionParticipantRole.INTERVIEWER } as never);
      repository.updateOwner.mockResolvedValue({ ...session, ownerId: INTERVIEWER_ID } as never);

      await service.transferOwnership(SESSION_ID, admin, { userId: INTERVIEWER_ID });

      expect(repository.updateOwner).toHaveBeenCalledWith(SESSION_ID, INTERVIEWER_ID);
    });

    it('отклоняет передачу самому себе', async () => {
      await expect(
        service.transferOwnership(SESSION_ID, owner, { userId: OWNER_ID }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('запрещает передачу в завершённой сессии', async () => {
      repository.findById.mockResolvedValue({ ...session, status: SessionStatus.COMPLETED } as never);

      await expect(
        service.transferOwnership(SESSION_ID, owner, { userId: INTERVIEWER_ID }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('end', () => {
    it('завершает сессию и закрывает LiveKit-комнату', async () => {
      repository.complete.mockResolvedValue({ ...session, status: SessionStatus.COMPLETED } as never);

      const result = await service.end(SESSION_ID, owner);

      expect(repository.complete).toHaveBeenCalledWith(SESSION_ID, expect.any(Date));
      expect(livekit.deleteRoom).toHaveBeenCalledWith(SESSION_ID);
      expect(result.status).toBe(SessionStatus.COMPLETED);
    });

    it('запрещает завершение всем, кроме владельца и админа', async () => {
      const interviewer: JwtPayload = { sub: INTERVIEWER_ID, email: 'i@test', isAdmin: false };

      await expect(service.end(SESSION_ID, interviewer)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.complete).not.toHaveBeenCalled();
    });

    it('разрешает завершение админу', async () => {
      const admin: JwtPayload = { sub: CANDIDATE_ID, email: 'a@test', isAdmin: true };
      repository.complete.mockResolvedValue({ ...session, status: SessionStatus.COMPLETED } as never);

      await service.end(SESSION_ID, admin);

      expect(repository.complete).toHaveBeenCalled();
    });

    it('повторное завершение ничего не меняет', async () => {
      repository.findById.mockResolvedValue({ ...session, status: SessionStatus.COMPLETED } as never);

      const result = await service.end(SESSION_ID, owner);

      expect(result.status).toBe(SessionStatus.COMPLETED);
      expect(repository.complete).not.toHaveBeenCalled();
      expect(livekit.deleteRoom).not.toHaveBeenCalled();
    });

    it('не завершает отменённую сессию', async () => {
      repository.findById.mockResolvedValue({ ...session, status: SessionStatus.CANCELLED } as never);

      await expect(service.end(SESSION_ID, owner)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createLivekitToken', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue({ ...session, status: SessionStatus.READY } as never);
      repository.findParticipant.mockResolvedValue({ role: SessionParticipantRole.CANDIDATE } as never);
      repository.findActiveParticipations.mockResolvedValue([]);
      repository.findUserById.mockResolvedValue({ firstName: 'Clara', lastName: null, email: 'c@test' } as never);
    });

    it('не начинает интервью, пока в комнате один участник', async () => {
      repository.countPresentParticipants.mockResolvedValue(1);

      await service.createLivekitToken(SESSION_ID, CANDIDATE_ID);

      expect(repository.markStarted).not.toHaveBeenCalled();
    });

    it('начинает интервью, когда в комнату вошёл второй участник', async () => {
      repository.countPresentParticipants.mockResolvedValue(2);

      await service.createLivekitToken(SESSION_ID, CANDIDATE_ID);

      expect(repository.markStarted).toHaveBeenCalledWith(SESSION_ID, expect.any(Date));
    });

    it('не переписывает время начала при повторном входе', async () => {
      repository.findById.mockResolvedValue({ ...session, startedAt: new Date() } as never);

      await service.createLivekitToken(SESSION_ID, CANDIDATE_ID);

      expect(repository.countPresentParticipants).not.toHaveBeenCalled();
      expect(repository.markStarted).not.toHaveBeenCalled();
    });
  });

  describe('findHistory', () => {
    it('возвращает завершённые сессии с ролью пользователя и остальными участниками', async () => {
      const startedAt = new Date('2026-08-28T16:05:00.000Z');
      const endedAt = new Date('2026-08-28T16:52:00.000Z');
      repository.findCompletedForUser.mockResolvedValue([
        {
          ...session,
          type: 'MOCK',
          status: SessionStatus.COMPLETED,
          startedAt,
          endedAt,
          participants: [
            { userId: OWNER_ID, role: SessionParticipantRole.INTERVIEWER },
            { userId: CANDIDATE_ID, role: SessionParticipantRole.CANDIDATE },
          ],
        },
      ] as never);

      const [item] = await service.findHistory(CANDIDATE_ID);

      expect(repository.findCompletedForUser).toHaveBeenCalledWith(CANDIDATE_ID);
      expect(item).toMatchObject({ id: SESSION_ID, type: 'MOCK', startedAt, endedAt });
      expect(item?.myRole).toBe(SessionParticipantRole.CANDIDATE);
      expect(item?.partners.map((partner) => partner.userId)).toEqual([OWNER_ID]);
    });
  });
});
