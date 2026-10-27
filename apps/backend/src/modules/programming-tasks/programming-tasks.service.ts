import { Injectable, NotFoundException } from '@nestjs/common';
import type { EditorLanguage } from '../../prisma/generated/enums.ts';
import { ProgrammingTaskListItemResponse } from './entities/programming-task.entity.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

@Injectable()
export class ProgrammingTasksService {
  constructor(private readonly repository: ProgrammingTasksRepository) {}

  async findAvailable(
    language: EditorLanguage,
  ): Promise<ProgrammingTaskListItemResponse[]> {
    const tasks = await this.repository.findAvailable(language);
    return tasks.map((task) => new ProgrammingTaskListItemResponse(task));
  }

  async findActiveForSession(id: string, language: EditorLanguage) {
    const task = await this.repository.findActiveForSession(id, language);
    if (!task || !task.variants[0]) {
      throw new NotFoundException(
        'Programming task is unavailable for the selected language',
      );
    }
    return task;
  }
}
