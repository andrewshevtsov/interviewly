import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProgrammingTaskDifficulty } from '../../../prisma/generated/enums.ts';

const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 10_000;

export class UpdateProgrammingTaskDetailsDto {
  @ApiProperty({
    description: 'Версия задачи, полученная из edit endpoint',
    format: 'date-time',
  })
  @IsISO8601({ strict: true })
  expectedUpdatedAt!: string;

  @ApiProperty({
    example: 'Сумма элементов массива',
    maxLength: TITLE_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({ maxLength: DESCRIPTION_MAX_LENGTH })
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
