import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SessionParticipantRole, SessionStatus } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import type { SessionsGateway } from '../sessions/sessions.gateway.ts';
import type { SessionsRepository } from '../sessions/sessions.repository.ts';
import type { SessionsService } from '../sessions/sessions.service.ts';
import { DEMO_TASKS, nextDemoTaskIndex } from './demo-tasks.ts';
import { DEMO_TASK_CHANGED_EVENT, DemoTasksService } from './demo-tasks.service.ts';
import type { SessionHintsRepository } from './session-hints.repository.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const interviewer: JwtPayload = { sub: 'interviewer', email: 'i@test', isAdmin: false };

describe('nextDemoTaskIndex', () => {
  it('первая задача зависит от сессии и попадает в диапазон', () => {
    const index = nextDemoTaskIndex(SESSION_ID, null);

    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(DEMO_TASKS.length);
  });

  it('после последней задачи возвращается к первой', () => {
    expect(nextDemoTaskIndex(SESSION_ID, 3)).toBe(4);
    expect(nextDemoTaskIndex(SESSION_ID, DEMO_TASKS.length - 1)).toBe(0);
  });
});

describe('DemoTasksService', () => {
  let sessionsRepository: Mocked<SessionsRepository>;
  let hintsRepository: Mocked<SessionHintsRepository>;
  let gateway: Mocked<SessionsGateway>;

  function createService(enabled: boolean): DemoTasksService {
    return new DemoTasksService(
      { requireRoomViewer: vi.fn().mockResolvedValue({ demoTaskIndex: 2 }) } as unknown as SessionsService,
      sessionsRepository,
      hintsRepository,
      gateway,
      { get: vi.fn().mockReturnValue(enabled ? 'true' : undefined) } as unknown as ConfigService,
    );
  }

  beforeEach(() => {
    sessionsRepository = {
      findById: vi.fn().mockResolvedValue({
        id: SESSION_ID,
        status: SessionStatus.ACTIVE,
        demoTaskIndex: 2,
      }),
      findParticipant: vi.fn().mockResolvedValue({ role: SessionParticipantRole.INTERVIEWER }),
    } as unknown as Mocked<SessionsRepository>;
    hintsRepository = {
      setDemoTaskIndex: vi.fn(),
    } as unknown as Mocked<SessionHintsRepository>;
    gateway = { emitToSession: vi.fn() } as unknown as Mocked<SessionsGateway>;
  });

  it('интервьюер показывает следующую задачу: она сохраняется и рассылается комнате', async () => {
    const result = await createService(true).next(SESSION_ID, interviewer);

    expect(result).toMatchObject({ index: 3, total: DEMO_TASKS.length, task: DEMO_TASKS[3]?.task });
    expect(hintsRepository.setDemoTaskIndex).toHaveBeenCalledWith(SESSION_ID, 3);
    expect(gateway.emitToSession).toHaveBeenCalledWith(SESSION_ID, DEMO_TASK_CHANGED_EVENT, result);
  });

  it('кандидат не может сменить задачу', async () => {
    sessionsRepository.findParticipant.mockResolvedValue({
      role: SessionParticipantRole.CANDIDATE,
    } as never);

    await expect(createService(true).next(SESSION_ID, interviewer)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(hintsRepository.setDemoTaskIndex).not.toHaveBeenCalled();
  });

  it('в закрытой сессии задачу не сменить', async () => {
    sessionsRepository.findById.mockResolvedValue({
      id: SESSION_ID,
      status: SessionStatus.COMPLETED,
      demoTaskIndex: null,
    } as never);

    await expect(createService(true).next(SESSION_ID, interviewer)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('без AI_HINTS_DEMO_CONTEXT смена задачи недоступна, а текущей задачи нет', async () => {
    const service = createService(false);

    await expect(service.next(SESSION_ID, interviewer)).rejects.toBeInstanceOf(NotFoundException);
    expect(service.current({ demoTaskIndex: 2 })).toBeNull();
    expect(await service.getState(SESSION_ID, interviewer)).toEqual({ enabled: false, current: null });
  });

  it('getState отдаёт текущую задачу комнаты', async () => {
    const state = await createService(true).getState(SESSION_ID, interviewer);

    expect(state.enabled).toBe(true);
    expect(state.current).toMatchObject({ index: 2, code: DEMO_TASKS[2]?.code });
  });
});
