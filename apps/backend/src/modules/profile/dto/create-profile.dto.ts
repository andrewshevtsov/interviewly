import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProfessionLevel {
  junior = 'junior',
  middle = 'middle',
  senior = 'senior',
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'Полное имя пользователя',
    example: 'Иван Иванов',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Профессиональная должность или название роли',
    example: 'Разработчик программного обеспечения',
  })
  @IsString()
  role!: string;

  @ApiProperty({
    description: 'Адрес электронной почты',
    example: 'ivan@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Имя пользователя в Telegram (необязательно)',
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
}
