import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SessionParticipantRole, SessionStatus } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { EDITOR_TOGGLED_EVENT, SessionEditorService } from './session-editor.service.ts';
import type { SessionsGateway } from './sessions.gateway.ts';
import type { SessionsRepository } from './sessions.repository.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const actor: JwtPayload = { sub: 'user', email: 'u@test', isAdmin: false };

describe('SessionEditorService', () => {
  let repository: Mocked<SessionsRepository>;
  let gateway: Mocked<SessionsGateway>;
  let service: SessionEditorService;

  beforeEach(() => {
    repository = {
      findById: vi.fn().mockResolvedValue({
        id: SESSION_ID,
        status: SessionStatus.ACTIVE,
        editorOpen: false,
      }),
      findParticipant: vi.fn().mockResolvedValue({ role: SessionParticipantRole.INTERVIEWER }),
      setEditorOpen: vi.fn(),
    } as unknown as Mocked<SessionsRepository>;
    gateway = { emitToSession: vi.fn() } as unknown as Mocked<SessionsGateway>;
    service = new SessionEditorService(repository, gateway);
  });

  it('интервьюер открывает редактор: состояние сохраняется и рассылается комнате', async () => {
    const result = await service.setOpen(SESSION_ID, actor, true);

    expect(result).toEqual({ open: true });
    expect(repository.setEditorOpen).toHaveBeenCalledWith(SESSION_ID, true);
    expect(gateway.emitToSession).toHaveBeenCalledWith(SESSION_ID, EDITOR_TOGGLED_EVENT, result);
  });

  it('интервьюер закрывает открытый редактор', async () => {
    repository.findById.mockResolvedValue({
      id: SESSION_ID,
      status: SessionStatus.ACTIVE,
      editorOpen: true,
    } as never);

    expect(await service.setOpen(SESSION_ID, actor, false)).toEqual({ open: false });
    expect(repository.setEditorOpen).toHaveBeenCalledWith(SESSION_ID, false);
  });

  it('повторное открытие ничего не пишет и не рассылает', async () => {
    repository.findById.mockResolvedValue({
      id: SESSION_ID,
      status: SessionStatus.ACTIVE,
      editorOpen: true,
    } as never);

    expect(await service.setOpen(SESSION_ID, actor, true)).toEqual({ open: true });
    expect(repository.setEditorOpen).not.toHaveBeenCalled();
    expect(gateway.emitToSession).not.toHaveBeenCalled();
  });

  it('кандидат и не участник не могут переключить редактор', async () => {
    repository.findParticipant.mockResolvedValueOnce({
      role: SessionParticipantRole.CANDIDATE,
    } as never);
    await expect(service.setOpen(SESSION_ID, actor, true)).rejects.toBeInstanceOf(ForbiddenException);

    repository.findParticipant.mockResolvedValueOnce(null);
    await expect(service.setOpen(SESSION_ID, actor, true)).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.setEditorOpen).not.toHaveBeenCalled();
  });

  it('в закрытой сессии редактор не переключить', async () => {
    repository.findById.mockResolvedValue({
      id: SESSION_ID,
      status: SessionStatus.COMPLETED,
      editorOpen: false,
    } as never);

    await expect(service.setOpen(SESSION_ID, actor, true)).rejects.toBeInstanceOf(ConflictException);
  });
});
