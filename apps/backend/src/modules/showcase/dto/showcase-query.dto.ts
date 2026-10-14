import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionLevel } from '../../../prisma/generated/enums.ts';

export const DEFAULT_SHOWCASE_LIMIT = 20;
export const MAX_SHOWCASE_LIMIT = 50;

// `?stack=A` приходит строкой, `?stack=A&stack=B` - массивом: приводим к массиву.
const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const trimToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

// Фильтры не чувствительны к регистру: приводим значения к тому виду, в котором их хранит БД
const mapStrings = (fn: (value: string) => string) => (params: { value: unknown }) => {
  const list = toArray(params);
  return list?.map((item: unknown) => (typeof item === 'string' ? fn(item) : item));
};
const lowerTrimmed = (value: string) => value.trim().toLowerCase();

export class ShowcaseQueryDto {
  @ApiPropertyOptional({
    description: 'Подходит любой из перечисленных уровней, регистр не важен. Повторяющийся параметр: ?level=junior&level=middle',
    enum: ProfessionLevel,
    isArray: true,
  })
  @IsOptional()
  @Transform(mapStrings(lowerTrimmed))
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(ProfessionLevel, { each: true })
  level?: ProfessionLevel[];

  @ApiPropertyOptional({
    description: 'Подходит профиль, у которого есть любая из технологий (точное совпадение тега, регистр не важен: React = react)',
    type: [String],
  })
  @IsOptional()
  @Transform(mapStrings(lowerTrimmed))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  stack?: string[];

  @ApiPropertyOptional({
    description: 'Поиск без учёта регистра по имени, фамилии, роли и (точное совпадение) по тегам стека',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Размер страницы',
    minimum: 1,
    maximum: MAX_SHOWCASE_LIMIT,
    default: DEFAULT_SHOWCASE_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SHOWCASE_LIMIT)
  limit: number = DEFAULT_SHOWCASE_LIMIT;

  @ApiPropertyOptional({
    description: 'Значение nextCursor из предыдущего ответа',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
