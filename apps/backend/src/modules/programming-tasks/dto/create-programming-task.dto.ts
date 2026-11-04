import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidateNested,
  type ValidationOptions,
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

/**
 * Обрезает пробелы по краям до валидации, иначе строка из одних пробелов
 * проходит `@MinLength(1)`, а после ручного `.trim()` в сервисе становится пустой.
 * @param {{ value: unknown }} params - Исходное значение поля от class-transformer.
 * @returns {unknown} Обрезанная строка либо исходное значение, если это не строка.
 */
export function trimmed(params: { value: unknown }): unknown {
  return typeof params.value === 'string' ? params.value.trim() : params.value;
}

/**
 * Требует, чтобы поле присутствовало в запросе, но, в отличие от `@IsDefined()`,
 * разрешает `null` - это валидный JSON-результат (например, Python `None`),
 * а не отсутствие значения.
 */
function IsDefinedOrNull(validationOptions?: ValidationOptions) {
  return function (target: object, propertyKey: string): void {
    registerDecorator({
      name: 'isDefinedOrNull',
      target: target.constructor,
      propertyName: propertyKey,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return value !== undefined;
        },
        defaultMessage(): string {
          return `${propertyKey} should not be undefined (null is allowed)`;
        },
      },
    });
  };
}

export class CreateProgrammingTaskCaseDto {
  @ApiProperty({ example: 'Сумма положительных чисел' })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(TEST_CASE_NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({
    description: 'JSON-совместимые входные данные (null допустим)',
    example: [1, 2, 3, 4],
    nullable: true,
  })
  @IsDefinedOrNull()
  input!: unknown;

  @ApiProperty({
    description: 'JSON-совместимый ожидаемый результат (null допустим)',
    example: 10,
    nullable: true,
  })
  @IsDefinedOrNull()
  expectedOutput!: unknown;
}

export class CreateProgrammingTaskDto {
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
