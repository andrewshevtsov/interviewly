import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  EditorLanguage,
  ProgrammingTaskDifficulty,
} from '../../../prisma/generated/enums.ts';

const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 10_000;
const CODE_MAX_LENGTH = 50_000;
const TEST_CASE_NAME_MAX_LENGTH = 160;
const MAX_TEST_CASES = 20;

export class CreateProgrammingTaskCaseDto {
  @ApiProperty({ example: 'Сумма положительных чисел' })
  @IsString()
  @MinLength(1)
  @MaxLength(TEST_CASE_NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({
    description: 'JSON-совместимые входные данные',
    example: [1, 2, 3, 4],
  })
  @IsDefined()
  input!: unknown;

  @ApiProperty({
    description: 'JSON-совместимый ожидаемый результат',
    example: 10,
  })
  @IsDefined()
  expectedOutput!: unknown;
}

export class CreateProgrammingTaskDto {
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

  @ApiProperty({ enum: EditorLanguage, enumName: 'EditorLanguage' })
  @IsEnum(EditorLanguage)
  language!: EditorLanguage;

  @ApiProperty({ maxLength: CODE_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CODE_MAX_LENGTH)
  starterCode!: string;

  @ApiProperty({ maxLength: CODE_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CODE_MAX_LENGTH)
  harnessCode!: string;

  @ApiProperty({ maxLength: CODE_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CODE_MAX_LENGTH)
  referenceSolution!: string;

  @ApiProperty({ type: [CreateProgrammingTaskCaseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_TEST_CASES)
  @ValidateNested({ each: true })
  @Type(() => CreateProgrammingTaskCaseDto)
  testCases!: CreateProgrammingTaskCaseDto[];
}
