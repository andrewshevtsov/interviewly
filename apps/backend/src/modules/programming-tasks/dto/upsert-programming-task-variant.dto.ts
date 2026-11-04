import { OmitType } from '@nestjs/swagger';
import { CreateProgrammingTaskDto } from './create-programming-task.dto.ts';

export class UpsertProgrammingTaskVariantDto extends OmitType(
  CreateProgrammingTaskDto,
  ['title', 'description', 'difficulty'] as const,
) {}
