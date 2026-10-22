import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { DeepseekService } from '../../infrastructure/deepseek/deepseek.service.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import {
  EditorLanguage,
  SessionParticipantRole,
  SessionStatus,
} from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import type { SessionsGateway } from '../sessions/sessions.gateway.ts';
import type { SessionsRepository } from '../sessions/sessions.repository.ts';
import type { SessionsService } from '../sessions/sessions.service.ts';
import type { DemoTask } from './demo-tasks.ts';
import type { DemoTasksService } from './demo-tasks.service.ts';
import type { SessionHintsRepository } from './session-hints.repository.ts';
import {
  HINT_CREATED_EVENT,
  MAX_AI_HINTS_PER_SESSION,
  SessionHintsService,
} from './session-hints.service.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const CANDIDATE_ID = '44444444-4444-4444-4444-444444444444';

const candidate: JwtPayload = { sub: CANDIDATE_ID, email: 'candidate@test', isAdmin: false };
const session = {
  id: SESSION_ID,
  status: SessionStatus.ACTIVE,
  task: 'Разверните связный список',
  editorLanguage: EditorLanguage.PYTHON,
};
const requester = { id: CANDIDATE_ID, firstName: 'C', lastName: null, email: 'candidate@test' };

function hint(order: number) {
  return {
    id: `hint-${order}`,
    sessionId: SESSION_ID,
    requestedById: CANDIDATE_ID,
    order,
    text: `Подсказка ${order}`,
    createdAt: new Date(),
    requestedBy: requester,
  };
}

describe('SessionHintsService', () => {
  let hintsRepository: Mocked<SessionHintsRepository>;
  let sessionsRepository: Mocked<SessionsRepository>;
  let deepseek: Mocked<DeepseekService>;
  let gateway: Mocked<SessionsGateway>;
  let service: SessionHintsService;

  function createService(demoTask: DemoTask | null): SessionHintsService {
    return new SessionHintsService(
      hintsRepository,
      sessionsRepository,
      { requireRoomViewer: vi.fn() } as unknown as SessionsService,
      deepseek,
      gateway,
      { current: vi.fn().mockReturnValue(demoTask) } as unknown as DemoTasksService,
    );
  }

  beforeEach(() => {
    hintsRepository = {
      listBySession: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data: { order: number }) =>
        Promise.resolve(hint(data.order)),
      ),
    } as unknown as Mocked<SessionHintsRepository>;
    sessionsRepository = {
      findById: vi.fn().mockResolvedValue(session),
      findParticipant: vi.fn().mockResolvedValue({ role: SessionParticipantRole.CANDIDATE }),
    } as unknown as Mocked<SessionsRepository>;
    deepseek = {
      complete: vi.fn().mockResolvedValue('Подумайте о двух указателях.'),
    } as unknown as Mocked<DeepseekService>;
    gateway = { emitToSession: vi.fn() } as unknown as Mocked<SessionsGateway>;

    service = createService(null);
  });

  it('кандидат получает подсказку, она сохраняется и рассылается комнате', async () => {
    hintsRepository.listBySession.mockResolvedValue([hint(1)]);

    const result = await service.request(SESSION_ID, candidate, { code: 'def f(): pass' });

    expect(hintsRepository.create).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      requestedById: CANDIDATE_ID,
      order: 2,
      text: 'Подумайте о двух указателях.',
    });
    expect(gateway.emitToSession).toHaveBeenCalledWith(SESSION_ID, HINT_CREATED_EVENT, result);
    const prompt = deepseek.complete.mock.calls[0]?.[0][1]?.content;
    expect(prompt).toContain('def f(): pass');
    expect(prompt).toContain('Подсказка 1');
  });

  it('интервьюер не может запросить подсказку', async () => {
    sessionsRepository.findParticipant.mockResolvedValue({
      role: SessionParticipantRole.INTERVIEWER,
    } as never);

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(deepseek.complete).not.toHaveBeenCalled();
  });

  it('не участник не может запросить подсказку', async () => {
    sessionsRepository.findParticipant.mockResolvedValue(null);

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('подсказки доступны только в ACTIVE-сессии', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...session,
      status: SessionStatus.READY,
    } as never);

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('404 для несуществующей сессии', async () => {
    sessionsRepository.findById.mockResolvedValue(null);

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('после исчерпания лимита модель не вызывается', async () => {
    hintsRepository.listBySession.mockResolvedValue(
      Array.from({ length: MAX_AI_HINTS_PER_SESSION }, (_, index) => hint(index + 1)),
    );

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(deepseek.complete).not.toHaveBeenCalled();
  });

  it('гонка двух запросов за один номер превращается в 409', async () => {
    hintsRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(gateway.emitToSession).not.toHaveBeenCalled();
  });

  it('сбой модели не тратит лимит и ничего не рассылает', async () => {
    deepseek.complete.mockRejectedValue(new ServiceUnavailableException());

    await expect(service.request(SESSION_ID, candidate, {})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(hintsRepository.create).not.toHaveBeenCalled();
    expect(gateway.emitToSession).not.toHaveBeenCalled();
  });

  it('показанная интервьюером демо-задача становится контекстом подсказки', async () => {
    const demoTask: DemoTask = {
      language: 'TYPESCRIPT',
      task: 'Найдите дубликаты',
      code: 'function dup() {}',
    };

    await createService(demoTask).request(SESSION_ID, candidate, {});

    const prompt = deepseek.complete.mock.calls[0]?.[0][1]?.content;
    expect(prompt).toContain('<task>\nНайдите дубликаты\n</task>');
    expect(prompt).toContain('<code>\nfunction dup() {}\n</code>');
    expect(prompt).toContain('Язык редактора: typescript');
  });

  it('без демо-задачи используется условие сессии', async () => {
    await service.request(SESSION_ID, candidate, {});

    const prompt = deepseek.complete.mock.calls[0]?.[0][1]?.content;
    expect(prompt).toContain(`<task>\n${session.task}\n</task>`);
  });

  it('list отдаёт подсказки и остаток лимита', async () => {
    hintsRepository.listBySession.mockResolvedValue([hint(1)]);

    const result = await service.list(SESSION_ID, candidate);

    expect(result.hints).toHaveLength(1);
    expect(result.remaining).toBe(MAX_AI_HINTS_PER_SESSION - 1);
  });
});
