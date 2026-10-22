import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SessionsGateway } from '../sessions/sessions.gateway.ts';
import { SESSION_PERMISSIONS } from '../sessions/sessions.permissions.ts';
import { SessionsRepository } from '../sessions/sessions.repository.ts';
import { SessionsService } from '../sessions/sessions.service.ts';
import { DEMO_TASKS, nextDemoTaskIndex, type DemoTask } from './demo-tasks.ts';
import { DemoTaskResponse, DemoTaskStateResponse } from './entities/demo-task.entity.ts';
import { SessionHintsRepository } from './session-hints.repository.ts';

/** Событие socket.io: интервьюер показал новую демо-задачу */
export const DEMO_TASK_CHANGED_EVENT = 'demo-task:changed';

const CLOSED_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
  SessionStatus.EXPIRED,
]);

/**
 * Временные демо-задачи, пока нет реалтайм-редактора: интервьюер переключает
 * задачу, все участники видят её, а подсказка строится по ней.
 */
@Injectable()
export class DemoTasksService {
  private readonly enabled: boolean;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly hintsRepository: SessionHintsRepository,
    private readonly gateway: SessionsGateway,
    configService: ConfigService,
  ) {
    this.enabled = configService.get<string>('AI_HINTS_DEMO_CONTEXT') === 'true';
  }

  /** Текущая задача сессии; `null`, если режим выключен или задачу ещё не показали. */
  current(session: { demoTaskIndex: number | null }): DemoTask | null {
    if (!this.enabled || session.demoTaskIndex === null) {
      return null;
    }
    return DEMO_TASKS[session.demoTaskIndex] ?? null;
  }

  async getState(sessionId: string, actor: JwtPayload): Promise<DemoTaskStateResponse> {
    const session = await this.sessionsService.requireRoomViewer(sessionId, actor);
    const index = this.current(session) ? session.demoTaskIndex : null;

    return new DemoTaskStateResponse({
      enabled: this.enabled,
      current: index === null ? null : this.toResponse(index),
    });
  }

  async next(sessionId: string, actor: JwtPayload): Promise<DemoTaskResponse> {
    if (!this.enabled) {
      throw new NotFoundException('Demo tasks are disabled');
    }

    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session "${sessionId}" not found`);
    }
    if (CLOSED_STATUSES.has(session.status)) {
      throw new ConflictException(`Session "${sessionId}" is ${session.status.toLowerCase()}`);
    }

    const participant = await this.sessionsRepository.findParticipant(sessionId, actor.sub);
    const allowedRoles: readonly string[] = SESSION_PERMISSIONS.switchDemoTask.allowRoles;
    if (!participant || !allowedRoles.includes(participant.role)) {
      throw new ForbiddenException('Only the interviewer can switch the task');
    }

    const index = nextDemoTaskIndex(sessionId, session.demoTaskIndex);
    await this.hintsRepository.setDemoTaskIndex(sessionId, index);

    const response = this.toResponse(index);
    this.gateway.emitToSession(sessionId, DEMO_TASK_CHANGED_EVENT, response);
    return response;
  }

  private toResponse(index: number): DemoTaskResponse {
    const task = DEMO_TASKS[index];
    if (!task) {
      throw new Error(`Demo task #${index} does not exist`);
    }
    return new DemoTaskResponse({ index, total: DEMO_TASKS.length, ...task });
  }
}
