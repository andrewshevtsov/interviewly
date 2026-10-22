import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProfessionLevel {
  junior = 'junior',
  middle = 'middle',
  senior = 'senior',
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'Профессиональная должность или название роли',
    example: 'Разработчик программного обеспечения',
  })
  @IsString()
  role!: string;

  @ApiProperty({
    description: 'Уровень профессионализма',
    enum: ProfessionLevel,
    example: ProfessionLevel.middle,
  })
  @IsEnum(ProfessionLevel)
  level!: ProfessionLevel;

  @ApiProperty({
    description: 'Массив технологий в стеке разработки',
    example: ['TypeScript', 'NestJS', 'PostgreSQL'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  stack!: string[];

  @ApiProperty({
    description: 'Биография пользователя (необязательно)',
    example: 'Увлеченный разработчик с 5 годами опыта',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description:
      'Показывать профиль на витрине участников. Включить можно, только если заполнены роль и стек. Если не передан, значение не меняется (для нового профиля - false)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showcaseVisible?: boolean;
}
