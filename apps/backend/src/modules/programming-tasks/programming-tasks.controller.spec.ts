import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import {
  EditorLanguage,
  ProgrammingTaskDifficulty,
} from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { AdminGuard } from '../auth/guards/admin.guard.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import type { CreateProgrammingTaskDto } from './dto/create-programming-task.dto.ts';
import { ProgrammingTasksAdminController } from './programming-tasks-admin.controller.ts';
import { ProgrammingTasksController } from './programming-tasks.controller.ts';
import type { ProgrammingTasksService } from './programming-tasks.service.ts';

const revision = new Date('2026-10-28T12:00:00.000Z');
const admin: JwtPayload = {
  sub: 'admin-id',
  email: 'admin@interviewly.test',
  isAdmin: true,
};
const input: CreateProgrammingTaskDto = {
  title: 'Sum',
  description: 'Return sum.',
  difficulty: ProgrammingTaskDifficulty.EASY,
  language: EditorLanguage.JAVASCRIPT,
  starterCode: 'function solve(numbers) {}',
  harnessCode: 'console.log(JSON.stringify(solve(input)));',
  referenceSolution: 'function solve(numbers) { return 6; }',
  testCases: [{ name: 'Case 1', input: [1, 2, 3], expectedOutput: 6 }],
};

describe('Programming task controllers', () => {
  let service: Mocked<ProgrammingTasksService>;
  let publicController: ProgrammingTasksController;
  let adminController: ProgrammingTasksAdminController;

  beforeEach(() => {
    service = {
      createAndVerify: vi.fn(),
      addVariantAndVerify: vi.fn(),
      updateAndVerify: vi.fn(),
      updateDetails: vi.fn(),
      delete: vi.fn(),
      getHarnessTemplate: vi.fn(),
      findForEditing: vi.fn(),
      findAvailable: vi.fn(),
    } as unknown as Mocked<ProgrammingTasksService>;
    publicController = new ProgrammingTasksController(service);
    adminController = new ProgrammingTasksAdminController(service);
  });

  it('защищает весь admin-контроллер JWT и проверкой isAdmin', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ProgrammingTasksAdminController),
    ).toEqual([JwtAuthGuard, AdminGuard]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ProgrammingTasksController),
    ).toEqual([JwtAuthGuard]);
  });

  it('оставляет получение доступных задач в обычном контроллере', async () => {
    service.findAvailable.mockResolvedValue([]);

    await publicController.findAvailable({
      language: EditorLanguage.JAVASCRIPT,
    });

    expect(service.findAvailable).toHaveBeenCalledWith(
      EditorLanguage.JAVASCRIPT,
    );
  });

  it('передаёт id администратора при создании задачи', async () => {
    await adminController.create(admin, input);

    expect(service.createAndVerify).toHaveBeenCalledWith(admin.sub, input);
  });

  it('вызывает нужные методы полного admin-флоу', async () => {
    await adminController.updateDetails('task-id', {
      expectedUpdatedAt: revision.toISOString(),
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
    });
    await adminController.addVariant(admin, 'task-id', input);
    await adminController.updateAndVerify('task-id', 'variant-id', input);
    await adminController.getHarnessTemplate(EditorLanguage.JAVASCRIPT);
    await adminController.findForEditing('task-id');
    await adminController.delete('task-id');

    expect(service.updateDetails).toHaveBeenCalledWith(
      'task-id',
      expect.objectContaining({ title: 'Sum' }),
    );
    expect(service.addVariantAndVerify).toHaveBeenCalledWith(
      'task-id',
      admin.sub,
      input,
    );
    expect(service.updateAndVerify).toHaveBeenCalledWith(
      'task-id',
      'variant-id',
      input,
    );
    expect(service.getHarnessTemplate).toHaveBeenCalledWith(
      EditorLanguage.JAVASCRIPT,
    );
    expect(service.findForEditing).toHaveBeenCalledWith('task-id');
    expect(service.delete).toHaveBeenCalledWith('task-id');
  });
});
