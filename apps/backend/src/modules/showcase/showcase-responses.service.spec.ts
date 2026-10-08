import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client.ts';
import type { ShowcaseResponse } from '../../prisma/generated/client.ts';
import type { NotificationsService } from '../notifications/notifications.service.ts';
import type { SessionsService } from '../sessions/sessions.service.ts';
import type {
  ShowcaseResponsesRepository,
  CardForResponse,
  ReviewTarget,
} from './showcase-responses.repository.ts';
import { ShowcaseResponsesService } from './showcase-responses.service.ts';
import { CreateShowcaseResponseDto } from './dto/create-showcase-response.dto.ts';
import { RejectShowcaseResponseDto } from './dto/reject-showcase-response.dto.ts';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const hoursFromNow = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000);
const SLOT = hoursFromNow(24);
const SLOT_ISO = SLOT.toISOString();

const card = (overrides: Partial<CardForResponse> = {}): CardForResponse => ({
  id: 'card',
  userId: 'owner',
  showcaseVisible: true,
  user: { status: 'ACTIVE' },
  ...overrides,
});

const response = (overrides: Partial<ShowcaseResponse> = {}): ShowcaseResponse => ({
  id: 'resp',
  cardId: 'card',
  responderId: 'me',
  role: 'CANDIDATE',
  status: 'PENDING',
  scheduledAt: SLOT,
  rejectionReason: null,
  reviewedAt: null,
  timeMismatch: false,
  sessionId: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const target = (overrides: Partial<ReviewTarget> = {}): ReviewTarget => ({
  ...response(),
  card: { userId: 'owner' },
  ...overrides,
});

describe('ShowcaseResponsesService', () => {
  let repository: Mocked<ShowcaseResponsesRepository>;
  let sessions: Mocked<SessionsService>;
  let notifications: Mocked<NotificationsService>;
  let service: ShowcaseResponsesService;
  const tx = { tx: true } as never;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    repository = {
      transaction: vi.fn((run: (client: never) => Promise<unknown>) => run(tx)),
      lockUsers: vi.fn(),
      findCard: vi.fn(),
      hasProfile: vi.fn(),
      expireOverdue: vi.fn(),
      findLatest: vi.fn(),
      findBusyUserIds: vi.fn(),
      hasPendingResponseAround: vi.fn(),
      create: vi.fn(),
      findForReview: vi.fn(),
      decide: vi.fn(),
      attachSession: vi.fn(),
      findIncoming: vi.fn(),
      findOutgoing: vi.fn(),
    } as unknown as Mocked<ShowcaseResponsesRepository>;
    sessions = { createMatchSession: vi.fn() } as unknown as Mocked<SessionsService>;
    notifications = {
      notifyResponseCreated: vi.fn(),
      notifyResponseAccepted: vi.fn(),
      notifyResponseRejected: vi.fn(),
      scheduleSessionReminder: vi.fn(),
    } as unknown as Mocked<NotificationsService>;
    service = new ShowcaseResponsesService(repository, sessions, notifications);

    repository.findCard.mockResolvedValue(card());
    repository.hasProfile.mockResolvedValue(true);
    repository.findLatest.mockResolvedValue(null);
    repository.findBusyUserIds.mockResolvedValue(new Set());
    repository.hasPendingResponseAround.mockResolvedValue(false);
    repository.create.mockResolvedValue(response());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('respond', () => {
    const dto = { role: 'CANDIDATE', scheduledAt: SLOT_ISO } as const;

    it('создаёт отклик с ролью и временем, под блокировкой обоих участников', async () => {
      const result = await service.respond('me', 'card', dto);

      expect(repository.lockUsers).toHaveBeenCalledWith(['me', 'owner'], tx);
      expect(repository.create).toHaveBeenCalledWith(
        { cardId: 'card', responderId: 'me', role: 'CANDIDATE', scheduledAt: SLOT },
        tx,
      );
      expect(result).toMatchObject({ id: 'resp', status: 'PENDING', role: 'CANDIDATE', scheduledAt: SLOT });
      expect(result.reminderAt).toEqual(hoursFromNow(22));
    });

    it('после создания отклика уведомляет владельца карточки, на каждый отклик', async () => {
      await service.respond('me', 'card', dto);

      expect(notifications.notifyResponseCreated).toHaveBeenCalledWith('resp');
    });

    it('не уведомляет владельца, если отклик не создан', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['owner']));

      await expect(service.respond('me', 'card', dto)).rejects.toBeInstanceOf(ConflictException);

      expect(notifications.notifyResponseCreated).not.toHaveBeenCalled();
    });

    it('разрешает откликаться независимо от того, чем сейчас занят владелец, пока карточка на витрине', async () => {
      // Занятость владельца в другое время (не в этом слоте) отклик не блокирует
      repository.findBusyUserIds.mockResolvedValue(new Set());

      await expect(service.respond('me', 'card', dto)).resolves.toBeDefined();
    });

    it.each([
      ['карточки нет', null],
      ['карточка скрыта', card({ showcaseVisible: false })],
      ['владелец заблокирован и карточки нет на витрине', card({ user: { status: 'SUSPENDED' } })],
    ])('отвечает 404, если %s', async (_name, found) => {
      repository.findCard.mockResolvedValue(found);

      await expect(service.respond('me', 'card', dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('запрещает откликаться на свою карточку', async () => {
      await expect(service.respond('owner', 'card', dto)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('требует заполненный профиль у откликающегося', async () => {
      repository.hasProfile.mockResolvedValue(false);

      await expect(service.respond('me', 'card', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it.each([
      ['раньше чем через 3 часа', hoursFromNow(2.9)],
      ['в прошлом', hoursFromNow(-1)],
      ['дальше 30 дней', hoursFromNow(24 * 30 + 1)],
    ])('отклоняет время %s', async (_name, slot) => {
      await expect(
        service.respond('me', 'card', { role: 'CANDIDATE', scheduledAt: slot.toISOString() }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findCard).not.toHaveBeenCalled();
    });

    it('не даёт откликнуться второй раз, пока прошлый в ожидании', async () => {
      repository.findLatest.mockResolvedValue(response({ status: 'PENDING' }));

      await expect(service.respond('me', 'card', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('освобождает от просроченного отклика перед проверкой', async () => {
      await service.respond('me', 'card', dto);

      expect(repository.expireOverdue).toHaveBeenCalledWith({ cardId: 'card', responderId: 'me' }, tx);
    });

    it('не даёт повторить отклик раньше чем через 48 часов после отказа', async () => {
      repository.findLatest.mockResolvedValue(
        response({ status: 'REJECTED', reviewedAt: hoursFromNow(-47), rejectionReason: 'x' }),
      );

      await expect(service.respond('me', 'card', dto)).rejects.toThrow(/after 2026-10-10T13:00:00.000Z/);
    });

    it('разрешает повтор через 48 часов после отказа', async () => {
      repository.findLatest.mockResolvedValue(
        response({ status: 'REJECTED', reviewedAt: hoursFromNow(-48), rejectionReason: 'x' }),
      );

      await expect(service.respond('me', 'card', dto)).resolves.toBeDefined();
    });

    it('разрешает сразу предложить другое время, если отказ был из-за времени', async () => {
      repository.findLatest.mockResolvedValue(
        response({ status: 'REJECTED', reviewedAt: hoursFromNow(-1), rejectionReason: 'x', timeMismatch: true }),
      );

      await expect(service.respond('me', 'card', dto)).resolves.toBeDefined();
    });

    it.each(['ACCEPTED', 'CANCELLED', 'EXPIRED'] as const)('разрешает новый отклик после статуса %s', async (status) => {
      repository.findLatest.mockResolvedValue(response({ status, reviewedAt: hoursFromNow(-1) }));

      await expect(service.respond('me', 'card', dto)).resolves.toBeDefined();
    });

    it('не даёт откликнуться, если у откликающегося уже есть интервью в это время', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['me']));

      await expect(service.respond('me', 'card', dto)).rejects.toThrow(/You already have an interview/);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('не даёт откликнуться, если у откликающегося уже есть отклик в ожидании на пересекающееся время', async () => {
      repository.hasPendingResponseAround.mockResolvedValue(true);

      await expect(service.respond('me', 'card', dto)).rejects.toThrow(/pending response around this time/);
    });

    it('не даёт откликнуться на время, когда занят владелец карточки, и просит предложить другое', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['owner']));

      await expect(service.respond('me', 'card', dto)).rejects.toThrow(/owner is busy.*another time/);
      expect(repository.findBusyUserIds).toHaveBeenCalledWith(['me', 'owner'], SLOT, tx);
    });

    it('превращает гонку двух запросов (P2002) в 409', async () => {
      repository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' }),
      );

      await expect(service.respond('me', 'card', dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('accept', () => {
    beforeEach(() => {
      repository.findForReview.mockResolvedValue(target());
      repository.decide.mockResolvedValue(response({ status: 'ACCEPTED', reviewedAt: NOW }));
      repository.attachSession.mockResolvedValue(response({ status: 'ACCEPTED', sessionId: 'session', reviewedAt: NOW }));
      sessions.createMatchSession.mockResolvedValue({ id: 'session' } as never);
    });

    it('создаёт сессию на предложенное время; откликнувшийся кандидат - интервьюер владелец карточки', async () => {
      const result = await service.accept('owner', 'resp');

      expect(sessions.createMatchSession).toHaveBeenCalledWith(
        { interviewerId: 'owner', candidateId: 'me', scheduledAt: SLOT },
        tx,
      );
      expect(repository.attachSession).toHaveBeenCalledWith('resp', 'session', tx);
      expect(result).toMatchObject({ status: 'ACCEPTED', sessionId: 'session' });
    });

    it('после принятия уведомляет откликнувшегося и ставит напоминание за 2 часа до встречи', async () => {
      await service.accept('owner', 'resp');

      expect(notifications.notifyResponseAccepted).toHaveBeenCalledWith('resp');
      expect(notifications.scheduleSessionReminder).toHaveBeenCalledWith('session', SLOT);
    });

    it('не уведомляет, если принять не удалось', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['owner']));

      await expect(service.accept('owner', 'resp')).rejects.toBeInstanceOf(ConflictException);

      expect(notifications.notifyResponseAccepted).not.toHaveBeenCalled();
      expect(notifications.scheduleSessionReminder).not.toHaveBeenCalled();
    });

    it('если откликнувшийся хочет быть интервьюером, владельцем сессии становится он', async () => {
      repository.findForReview.mockResolvedValue(target({ role: 'INTERVIEWER' }));

      await service.accept('owner', 'resp');

      expect(sessions.createMatchSession).toHaveBeenCalledWith(
        { interviewerId: 'me', candidateId: 'owner', scheduledAt: SLOT },
        tx,
      );
    });

    it('блокирует обоих и проверяет занятость на время встречи', async () => {
      await service.accept('owner', 'resp');

      expect(repository.lockUsers).toHaveBeenCalledWith(['owner', 'me'], tx);
      expect(repository.findBusyUserIds).toHaveBeenCalledWith(['owner', 'me'], SLOT, tx);
    });

    it('не принимает отклик, если у владельца уже есть интервью в это время', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['owner']));

      await expect(service.accept('owner', 'resp')).rejects.toThrow(/mark it as a time mismatch/);
      expect(sessions.createMatchSession).not.toHaveBeenCalled();
      expect(repository.decide).not.toHaveBeenCalled();
    });

    it('не принимает отклик, если откликнувшийся успел занять это время', async () => {
      repository.findBusyUserIds.mockResolvedValue(new Set(['me']));

      await expect(service.accept('owner', 'resp')).rejects.toThrow(/no longer available/);
      expect(sessions.createMatchSession).not.toHaveBeenCalled();
    });

    it('не принимает отклик, время которого уже прошло, и помечает его просроченным', async () => {
      repository.findForReview.mockResolvedValue(target({ scheduledAt: hoursFromNow(-1) }));

      await expect(service.accept('owner', 'resp')).rejects.toThrow(/already passed/);
      expect(repository.expireOverdue).toHaveBeenCalledWith({ id: 'resp' });
    });

    it('отвечает 409, если отклик успели решить между проверкой и обновлением', async () => {
      repository.decide.mockResolvedValue(null);

      await expect(service.accept('owner', 'resp')).rejects.toBeInstanceOf(ConflictException);
      expect(sessions.createMatchSession).not.toHaveBeenCalled();
    });

    it('отвечает 404, если отклика нет', async () => {
      repository.findForReview.mockResolvedValue(null);

      await expect(service.accept('owner', 'resp')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('запрещает принимать не владельцу карточки', async () => {
      await expect(service.accept('me', 'resp')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it.each(['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const)(
      'не принимает отклик в статусе %s',
      async (status) => {
        repository.findForReview.mockResolvedValue(target({ status }));

        await expect(service.accept('owner', 'resp')).rejects.toBeInstanceOf(ConflictException);
      },
    );
  });

  describe('reject', () => {
    beforeEach(() => {
      repository.findForReview.mockResolvedValue(target());
      repository.decide.mockResolvedValue(
        response({ status: 'REJECTED', reviewedAt: NOW, rejectionReason: 'reason' }),
      );
    });

    it('владелец отклоняет отклик с причиной', async () => {
      const result = await service.reject('owner', 'resp', { reason: 'reason' });

      expect(repository.decide).toHaveBeenCalledWith('resp', {
        status: 'REJECTED',
        rejectionReason: 'reason',
        timeMismatch: false,
      });
      expect(result.rejectionReason).toBe('reason');
    });

    it('после отказа уведомляет откликнувшегося', async () => {
      await service.reject('owner', 'resp', { reason: 'reason' });

      expect(notifications.notifyResponseRejected).toHaveBeenCalledWith('resp');
    });

    it('запоминает, что отказ только из-за времени', async () => {
      await service.reject('owner', 'resp', { reason: 'reason', timeMismatch: true });

      expect(repository.decide).toHaveBeenCalledWith(
        'resp',
        expect.objectContaining({ timeMismatch: true }),
      );
    });

    it('запрещает решать отклик не владельцу карточки, в том числе откликнувшемуся', async () => {
      await expect(service.reject('me', 'resp', { reason: 'r' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.decide).not.toHaveBeenCalled();
    });

    it('не даёт решить отклик повторно', async () => {
      repository.findForReview.mockResolvedValue(target({ status: 'ACCEPTED' }));

      await expect(service.reject('owner', 'resp', { reason: 'r' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('отвечает 409, если отклик успели решить между проверкой и обновлением', async () => {
      repository.decide.mockResolvedValue(null);

      await expect(service.reject('owner', 'resp', { reason: 'r' })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      repository.findForReview.mockResolvedValue(target());
      repository.decide.mockResolvedValue(response({ status: 'CANCELLED', reviewedAt: NOW }));
    });

    it('автор отзывает свой отклик в ожидании', async () => {
      const result = await service.cancel('me', 'resp');

      expect(repository.decide).toHaveBeenCalledWith('resp', { status: 'CANCELLED' });
      expect(result.status).toBe('CANCELLED');
    });

    it('отвечает 404, если отклика нет', async () => {
      repository.findForReview.mockResolvedValue(null);

      await expect(service.cancel('me', 'resp')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('запрещает отзывать чужой отклик, в том числе владельцу карточки', async () => {
      await expect(service.cancel('owner', 'resp')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.decide).not.toHaveBeenCalled();
    });

    it.each(['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const)(
      'не отзывает отклик в статусе %s',
      async (status) => {
        repository.findForReview.mockResolvedValue(target({ status }));

        await expect(service.cancel('me', 'resp')).rejects.toBeInstanceOf(ConflictException);
      },
    );

    it('отвечает 409, если владелец решил отклик между проверкой и отзывом', async () => {
      repository.decide.mockResolvedValue(null);

      await expect(service.cancel('me', 'resp')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('списки', () => {
    it('входящие: показывают время, роль откликнувшегося и противоположную роль владельца без контактов', async () => {
      repository.findIncoming.mockResolvedValue([
        {
          ...response({ role: 'INTERVIEWER' }),
          responder: {
            firstName: 'Ivan',
            lastName: 'Petrov',
            profile: { role: 'Backend', level: 'senior', stack: ['NestJS'], bio: 'bio' },
          },
        },
      ]);

      const [item] = await service.findIncoming('owner', 'PENDING');

      expect(repository.expireOverdue).toHaveBeenCalledWith({ card: { userId: 'owner' } });
      expect(repository.findIncoming).toHaveBeenCalledWith('owner', 'PENDING');
      expect(item).toMatchObject({
        role: 'INTERVIEWER',
        ownerRole: 'CANDIDATE',
        scheduledAt: SLOT,
        responder: { name: 'Ivan Petrov', title: 'Backend', level: 'senior', stack: ['NestJS'] },
      });
      expect(JSON.stringify(item)).not.toMatch(/email|telegram/i);
    });

    it('входящие: у откликнувшегося без профиля поля профиля пустые', async () => {
      repository.findIncoming.mockResolvedValue([
        { ...response(), responder: { firstName: 'Clara', lastName: null, profile: null } },
      ]);

      const [item] = await service.findIncoming('owner');

      expect(item?.responder).toEqual({ name: 'Clara', title: null, level: null, stack: [], bio: null });
    });

    it('исходящие: после отказа отдают причину и время повтора; если отказ из-за времени, повтор сразу', async () => {
      const cardSummary = { id: 'card', role: 'Backend', user: { firstName: 'Ivan', lastName: null } };
      repository.findOutgoing.mockResolvedValue([
        {
          ...response({ status: 'REJECTED', reviewedAt: hoursFromNow(-1), rejectionReason: 'Не сейчас' }),
          card: cardSummary,
        },
        {
          ...response({ id: 't', status: 'REJECTED', reviewedAt: hoursFromNow(-1), rejectionReason: 'Время', timeMismatch: true }),
          card: cardSummary,
        },
        { ...response({ id: 'p', status: 'PENDING' }), card: cardSummary },
      ]);

      const [rejected, timeMismatch, pending] = await service.findOutgoing('me');

      expect(repository.expireOverdue).toHaveBeenCalledWith({ responderId: 'me' });
      expect(rejected).toMatchObject({
        rejectionReason: 'Не сейчас',
        canRetryAt: hoursFromNow(47),
        card: { name: 'Ivan', title: 'Backend' },
      });
      expect(timeMismatch?.canRetryAt).toBeNull();
      expect(pending?.canRetryAt).toBeNull();
    });
  });
});

describe('RejectShowcaseResponseDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: RejectShowcaseResponseDto });

  it('принимает причину из 100 и 500 символов', async () => {
    await expect(parse({ reason: 'а'.repeat(100) })).resolves.toBeInstanceOf(RejectShowcaseResponseDto);
    await expect(parse({ reason: 'а'.repeat(500) })).resolves.toBeInstanceOf(RejectShowcaseResponseDto);
  });

  it('отклоняет слишком короткую, слишком длинную и пустую причину', async () => {
    await expect(parse({ reason: 'а'.repeat(99) })).rejects.toThrow();
    await expect(parse({ reason: 'а'.repeat(501) })).rejects.toThrow();
    await expect(parse({})).rejects.toThrow();
  });

  it('считает длину после trim: пробелы не набирают нужные 100 символов', async () => {
    await expect(parse({ reason: `${' '.repeat(50)}${'а'.repeat(60)}${' '.repeat(50)}` })).rejects.toThrow();
  });

  it('принимает флаг timeMismatch только булевым', async () => {
    await expect(parse({ reason: 'а'.repeat(100), timeMismatch: true })).resolves.toBeDefined();
    await expect(parse({ reason: 'а'.repeat(100), timeMismatch: 'yes' })).rejects.toThrow();
  });
});

describe('CreateShowcaseResponseDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: CreateShowcaseResponseDto });

  it('принимает время с часовым поясом: Z и смещение', async () => {
    await expect(parse({ role: 'CANDIDATE', scheduledAt: '2026-10-12T15:00:00Z' })).resolves.toBeDefined();
    await expect(parse({ role: 'CANDIDATE', scheduledAt: '2026-10-12T15:00:00+04:00' })).resolves.toBeDefined();
  });

  it.each([
    { role: 'CANDIDATE', scheduledAt: '2026-10-12T15:00:00' },
    { role: 'CANDIDATE', scheduledAt: '2026-10-12' },
    { role: 'CANDIDATE', scheduledAt: 'завтра' },
    { role: 'CANDIDATE' },
    { role: 'HOST', scheduledAt: '2026-10-12T15:00:00Z' },
  ])('отклоняет %j', async (body) => {
    await expect(parse(body)).rejects.toThrow();
  });
});
