import { ProgrammingTaskDifficulty } from '../../../prisma/generated/enums.ts';

/** Публичные данные задачи для выбора при создании сессии. */
export class ProgrammingTaskListItemResponse {
  id!: string;
  slug!: string;
  title!: string;
  description!: string;
  difficulty!: ProgrammingTaskDifficulty;

  constructor(partial: ProgrammingTaskListItemResponse) {
    Object.assign(this, partial);
  }
}
