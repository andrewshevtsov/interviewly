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

/**
 * Тело запроса на создание пользователя. `passwordHash` формируется на сервере
 * (из сырого пароля), поэтому здесь принимается уже готовый хеш опционально —
 * пользователь может быть заведён и без пароля (например, приглашение).
 */
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  avatarPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationCompleted?: boolean;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
