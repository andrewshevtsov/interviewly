import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfessionLevel } from './create-profile.dto.ts';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Полное имя пользователя',
    example: 'Иван Иванов',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Профессиональная должность или название роли',
    example: 'Разработчик программного обеспечения',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Адрес электронной почты',
    example: 'ivan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Имя пользователя в Telegram',
    example: '@username',
    required: false,
  })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiProperty({
    description: 'Уровень профессионализма',
    enum: ProfessionLevel,
    example: ProfessionLevel.middle,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProfessionLevel)
  level?: ProfessionLevel;

  @ApiProperty({
    description: 'Массив технологий в стеке разработки',
    example: ['TypeScript', 'NestJS', 'PostgreSQL'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stack?: string[];

  @ApiProperty({
    description: 'Биография пользователя',
    example: 'Увлеченный разработчик с 5 годами опыта',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
