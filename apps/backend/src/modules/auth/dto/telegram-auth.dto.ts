import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';

/**
 * Данные, которые Telegram Login Widget передаёт в `data-onauth` callback
 * (https://core.telegram.org/widgets/login#receiving-authorization-data).
 * Имена полей оставлены как у Telegram (snake_case), чтобы фронтенд мог
 * переслать объект из виджета почти без изменений. Подлинность проверяется
 * отдельно по `hash` в `AuthService`, сам DTO её не гарантирует.
 */
export class TelegramAuthDto {
  @ApiProperty({ description: 'Числовой id аккаунта Telegram', example: 123456789 })
  @IsInt()
  @IsPositive()
  id!: number;

  @ApiProperty({ description: 'Имя пользователя в Telegram', example: 'Ivan' })
  @IsString()
  first_name!: string;

  @ApiPropertyOptional({ description: 'Фамилия пользователя в Telegram', example: 'Petrov' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Username в Telegram (без @)', example: 'ivan_petrov' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Ссылка на аватар пользователя в Telegram' })
  @IsOptional()
  @IsUrl()
  photo_url?: string;

  @ApiProperty({ description: 'Unix-время выдачи данных виджетом, секунды', example: 1758000000 })
  @IsInt()
  auth_date!: number;

  @ApiProperty({ description: 'HMAC-SHA256 подпись данных, выданная Telegram' })
  @IsString()
  hash!: string;
}
