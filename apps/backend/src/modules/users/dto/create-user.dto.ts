import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../../prisma/generated/enums.ts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Тело запроса на создание пользователя. `passwordHash` формируется на сервере
 * (из сырого пароля), поэтому здесь принимается уже готовый хеш опционально —
 * пользователь может быть заведён и без пароля (например, приглашение).
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email пользователя. Используется как логин и должен быть уникальным.',
    format: 'email',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Имя пользователя',
    minLength: 1,
    maxLength: 255,
    example: 'Иван',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName!: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    maxLength: 255,
    example: 'Иванов',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'Готовый bcrypt-хеш пароля. Формируется на сервере из сырого пароля; пользователь может быть создан и без него (приглашение).',
    example: '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq4B7Yb2H5T1oXw0P0h1s2c3d4e5f6',
  })
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({
    description: 'Относительный путь до файла аватара в хранилище',
    maxLength: 1024,
    example: 'avatars/2026/09/user-123.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  avatarPath?: string;

  @ApiPropertyOptional({
    description: 'Часовой пояс пользователя в формате IANA',
    maxLength: 64,
    example: 'Europe/Moscow',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;

  @ApiPropertyOptional({
    description: 'Признак администратора',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    description: 'Завершил ли пользователь регистрацию (заполнил обязательные поля профиля)',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  registrationCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Статус учётной записи',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
