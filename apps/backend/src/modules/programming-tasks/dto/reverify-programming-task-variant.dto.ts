import { OmitType } from '@nestjs/swagger';
import { CreateProgrammingTaskDto } from './create-programming-task.dto.ts';

// Язык варианта неизменяем: starterCode/harnessCode/testCases написаны под
// конкретный язык, поэтому PUT не принимает language и не может его сменить.
export class ReverifyProgrammingTaskVariantDto extends OmitType(
  CreateProgrammingTaskDto,
  ['title', 'description', 'difficulty', 'language'] as const,
) {}
