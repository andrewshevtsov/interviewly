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
const session = { id: SESSION_ID, ownerId: OWNER_ID, status: SessionStatus.ACTIVE };

function createMockRepository(): Mocked<SessionsRepository> {
  return {
    findById: vi.fn(),
    findParticipant: vi.fn(),
    updateOwner: vi.fn(),
  } as unknown as Mocked<SessionsRepository>;
}

describe('SessionsService', () => {
  let repository: Mocked<SessionsRepository>;
  let service: SessionsService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new SessionsService(repository, {} as LivekitService);
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
});
