import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProgrammingTaskDifficulty } from '../../../prisma/generated/enums.ts';
import { trimmed } from './create-programming-task.dto.ts';

const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 10_000;

export class UpdateProgrammingTaskDetailsDto {
  @ApiProperty({
    description: 'Версия задачи (optimistic locking), полученная из edit endpoint',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @ApiProperty({
    example: 'Сумма элементов массива',
    maxLength: TITLE_MAX_LENGTH,
  })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({ maxLength: DESCRIPTION_MAX_LENGTH })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description!: string;

  @ApiProperty({
    enum: ProgrammingTaskDifficulty,
    enumName: 'ProgrammingTaskDifficulty',
  })
  @IsEnum(ProgrammingTaskDifficulty)
  difficulty!: ProgrammingTaskDifficulty;
}
