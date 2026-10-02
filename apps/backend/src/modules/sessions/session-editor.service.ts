import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SessionEditorStateResponse } from './entities/session.entity.ts';
import { SessionsGateway } from './sessions.gateway.ts';
import { SESSION_PERMISSIONS } from './sessions.permissions.ts';
import { SessionsRepository } from './sessions.repository.ts';

/** Событие socket.io: интервьюер открыл/закрыл редактор */
export const EDITOR_TOGGLED_EVENT = 'editor:toggled';

const CLOSED_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
  SessionStatus.EXPIRED,
]);

/**
 * Режим комнаты: знакомство/лайв-кодинг.
 * Вынесен из SessionsService, потому что шлюз сам зависит от SessionsService.
 */
@Injectable()
export class SessionEditorService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly gateway: SessionsGateway,
  ) {}

  async setOpen(
    sessionId: string,
    actor: JwtPayload,
    open: boolean,
  ): Promise<SessionEditorStateResponse> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session "${sessionId}" not found`);
    }
    if (CLOSED_STATUSES.has(session.status)) {
      throw new ConflictException(`Session "${sessionId}" is ${session.status.toLowerCase()}`);
    }

    const participant = await this.sessionsRepository.findParticipant(sessionId, actor.sub);
    const allowedRoles: readonly string[] = SESSION_PERMISSIONS.toggleEditor.allowRoles;
    if (!participant || !allowedRoles.includes(participant.role)) {
      throw new ForbiddenException('Only an interviewer can open or close the editor');
    }

    const response = new SessionEditorStateResponse({ open });
    if (session.editorOpen === open) {
      return response;
    }

    await this.sessionsRepository.setEditorOpen(sessionId, open);
    this.gateway.emitToSession(sessionId, EDITOR_TOGGLED_EVENT, response);
    return response;
  }
}
