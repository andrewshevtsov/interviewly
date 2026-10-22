import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeepseekService } from '../../infrastructure/deepseek/deepseek.service.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SessionsGateway } from '../sessions/sessions.gateway.ts';
import { SESSION_PERMISSIONS } from '../sessions/sessions.permissions.ts';
import { SessionsRepository } from '../sessions/sessions.repository.ts';
import { SessionsService } from '../sessions/sessions.service.ts';
import { DemoTasksService } from './demo-tasks.service.ts';
import { RequestHintDto } from './dto/request-hint.dto.ts';
import { SessionHintEntity, SessionHintsResponse } from './entities/session-hint.entity.ts';
import { buildHintMessages, HINT_COMPLETION_OPTIONS, sanitizeHint } from './hint-prompt.ts';
import { SessionHintsRepository } from './session-hints.repository.ts';

export const MAX_AI_HINTS_PER_SESSION = 3;

/** Событие socket.io, которое получают все участники комнаты. */
export const HINT_CREATED_EVENT = 'hint:created';

@Injectable()
export class SessionHintsService {
  constructor(
    private readonly hintsRepository: SessionHintsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly sessionsService: SessionsService,
    private readonly deepseek: DeepseekService,
    private readonly gateway: SessionsGateway,
    private readonly demoTasks: DemoTasksService,
  ) {}

  async list(sessionId: string, actor: JwtPayload): Promise<SessionHintsResponse> {
    await this.sessionsService.requireRoomViewer(sessionId, actor);
    const hints = await this.hintsRepository.listBySession(sessionId);
    return this.toResponse(hints.map((hint) => new SessionHintEntity(hint)));
  }

  /**
   * Генерирует подсказку и рассылает её всей комнате. Лимит проверяется до
   * вызова модели, а уникальный номер подсказки защищает от гонки двух кликов.
   * Если модель не ответила, подсказка не сохраняется и лимит не тратится.
   */
  async request(
    sessionId: string,
    actor: JwtPayload,
    dto: RequestHintDto,
  ): Promise<SessionHintEntity> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session "${sessionId}" not found`);
    }
    if (session.status !== SessionStatus.ACTIVE) {
      throw new ConflictException('Hints are available only during an active interview');
    }

    const participant = await this.sessionsRepository.findParticipant(sessionId, actor.sub);
    const allowedRoles: readonly string[] = SESSION_PERMISSIONS.requestAiHint.allowRoles;
    if (!participant || !allowedRoles.includes(participant.role)) {
      throw new ForbiddenException('Only the candidate can request a hint');
    }

    const previous = await this.hintsRepository.listBySession(sessionId);
    if (previous.length >= MAX_AI_HINTS_PER_SESSION) {
      throw new ConflictException('Hint limit for this session is reached');
    }

    // Пока нет реалтайм-редактора, контекст - демо-задача от интервьюера
    const demoTask = this.demoTasks.current(session);
    const order = previous.length + 1;
    const raw = await this.deepseek.complete(
      buildHintMessages({
        task: demoTask?.task ?? session.task,
        code: dto.code ?? demoTask?.code,
        language: demoTask?.language ?? session.editorLanguage,
        previousHints: previous.map((hint) => hint.text),
        hintNumber: order,
        maxHints: MAX_AI_HINTS_PER_SESSION,
      }),
      HINT_COMPLETION_OPTIONS,
    );

    const hint = new SessionHintEntity(
      await this.save(sessionId, actor.sub, order, sanitizeHint(raw)),
    );
    this.gateway.emitToSession(sessionId, HINT_CREATED_EVENT, hint);
    return hint;
  }

  private async save(sessionId: string, requestedById: string, order: number, text: string) {
    try {
      return await this.hintsRepository.create({ sessionId, requestedById, order, text });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Another hint was requested at the same time, try again');
      }
      throw error;
    }
  }

  private toResponse(hints: SessionHintEntity[]): SessionHintsResponse {
    return new SessionHintsResponse({
      hints,
      limit: MAX_AI_HINTS_PER_SESSION,
      remaining: Math.max(0, MAX_AI_HINTS_PER_SESSION - hints.length),
    });
  }
}
