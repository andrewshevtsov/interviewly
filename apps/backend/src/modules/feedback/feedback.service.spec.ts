import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { FeedbackService } from './feedback.service.ts';
import { SessionParticipantRole } from '../../prisma/generated/enums.ts';
import type { FeedbackRepository } from './feedback.repository.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const AUTHOR_ID = '22222222-2222-2222-2222-222222222222';
const TARGET_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_ID = '44444444-4444-4444-4444-444444444444';
const FEEDBACK_ID = '55555555-5555-5555-5555-555555555555';

function createMockRepository(): Mocked<FeedbackRepository> {
  return {
    isSessionParticipant: vi.fn(),
    findParticipantRole: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findManyByAuthor: vi.fn(),
    update: vi.fn(),
    findOtherParticipants: vi.fn(),
  } as unknown as Mocked<FeedbackRepository>;
}

describe('FeedbackService', () => {
  let repository: Mocked<FeedbackRepository>;
  let service: FeedbackService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new FeedbackService(repository);
  });

  describe('create', () => {
    const dto = { targetUserId: TARGET_ID, score: 8, comment: 'Solid' };

    it('создаёт отзыв, если автор - интервьюер, а адресат участвовал в сессии', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.INTERVIEWER);
      repository.isSessionParticipant.mockResolvedValue(true);
      repository.findUnique.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: FEEDBACK_ID, sessionId: SESSION_ID, authorId: AUTHOR_ID, ...dto } as never);

      const result = await service.create(SESSION_ID, AUTHOR_ID, dto);

      expect(repository.create).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        authorId: AUTHOR_ID,
        targetUserId: TARGET_ID,
        score: dto.score,
        comment: dto.comment,
      });
      expect(result).toEqual(expect.objectContaining({ id: FEEDBACK_ID }));
    });

    it('запрещает оставить отзыв о самом себе', async () => {
      await expect(
        service.create(SESSION_ID, AUTHOR_ID, { ...dto, targetUserId: AUTHOR_ID }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('отклоняет, если автор не участвовал в сессии', async () => {
      repository.findParticipantRole.mockResolvedValue(null);

      await expect(service.create(SESSION_ID, AUTHOR_ID, dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('отклоняет, если автор - кандидат, а не интервьюер', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.CANDIDATE);

      await expect(service.create(SESSION_ID, AUTHOR_ID, dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('отклоняет, если адресат не участвовал в сессии', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.INTERVIEWER);
      repository.isSessionParticipant.mockResolvedValue(false);

      await expect(service.create(SESSION_ID, AUTHOR_ID, dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('отклоняет повторный отзыв для той же пары автор/адресат в этой сессии', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.INTERVIEWER);
      repository.isSessionParticipant.mockResolvedValue(true);
      repository.findUnique.mockResolvedValue({ id: FEEDBACK_ID } as never);

      await expect(service.create(SESSION_ID, AUTHOR_ID, dto)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findMine', () => {
    it('возвращает отзывы, оставленные текущим пользователем', async () => {
      repository.findManyByAuthor.mockResolvedValue([{ id: FEEDBACK_ID }] as never);

      const result = await service.findMine(AUTHOR_ID);

      expect(repository.findManyByAuthor).toHaveBeenCalledWith(AUTHOR_ID);
      expect(result).toEqual([{ id: FEEDBACK_ID }]);
    });
  });

  describe('findOne', () => {
    it('возвращает отзыв, если запрашивающий его автор', async () => {
      repository.findById.mockResolvedValue({ id: FEEDBACK_ID, authorId: AUTHOR_ID } as never);

      const result = await service.findOne(FEEDBACK_ID, AUTHOR_ID);

      expect(result).toEqual({ id: FEEDBACK_ID, authorId: AUTHOR_ID });
    });

    it('выбрасывает NotFoundException, если отзыв не найден', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(FEEDBACK_ID, AUTHOR_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('выбрасывает ForbiddenException, если запрашивающий не автор отзыва', async () => {
      repository.findById.mockResolvedValue({ id: FEEDBACK_ID, authorId: OTHER_ID } as never);

      await expect(service.findOne(FEEDBACK_ID, AUTHOR_ID)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('обновляет отзыв, принадлежащий запрашивающему', async () => {
      repository.findById.mockResolvedValue({ id: FEEDBACK_ID, authorId: AUTHOR_ID } as never);
      repository.update.mockResolvedValue({ id: FEEDBACK_ID, authorId: AUTHOR_ID, score: 5 } as never);

      const result = await service.update(FEEDBACK_ID, AUTHOR_ID, { score: 5 });

      expect(repository.update).toHaveBeenCalledWith(FEEDBACK_ID, { score: 5 });
      expect(result).toEqual(expect.objectContaining({ score: 5 }));
    });

    it('выбрасывает ForbiddenException при попытке обновить чужой отзыв', async () => {
      repository.findById.mockResolvedValue({ id: FEEDBACK_ID, authorId: OTHER_ID } as never);

      await expect(service.update(FEEDBACK_ID, AUTHOR_ID, { score: 5 })).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('выбрасывает NotFoundException при обновлении несуществующего отзыва', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(FEEDBACK_ID, AUTHOR_ID, { score: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findEligibleTargets', () => {
    it('возвращает остальных участников сессии в отображаемом виде', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.INTERVIEWER);
      repository.findOtherParticipants.mockResolvedValue([
        { user: { id: TARGET_ID, firstName: 'Clara', lastName: 'Candidate' } },
        { user: { id: OTHER_ID, firstName: 'Ivan', lastName: null } },
      ] as never);

      const result = await service.findEligibleTargets(SESSION_ID, AUTHOR_ID);

      expect(repository.findOtherParticipants).toHaveBeenCalledWith(SESSION_ID, AUTHOR_ID);
      expect(result).toEqual([
        { userId: TARGET_ID, name: 'Clara Candidate' },
        { userId: OTHER_ID, name: 'Ivan' },
      ]);
    });

    it('выбрасывает ForbiddenException, если запрашивающий не участвовал в сессии', async () => {
      repository.findParticipantRole.mockResolvedValue(null);

      await expect(service.findEligibleTargets(SESSION_ID, AUTHOR_ID)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findOtherParticipants).not.toHaveBeenCalled();
    });

    it('выбрасывает ForbiddenException, если запрашивающий - кандидат', async () => {
      repository.findParticipantRole.mockResolvedValue(SessionParticipantRole.CANDIDATE);

      await expect(service.findEligibleTargets(SESSION_ID, AUTHOR_ID)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findOtherParticipants).not.toHaveBeenCalled();
    });
  });
});
