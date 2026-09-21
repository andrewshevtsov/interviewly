import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

/**
 * Query-параметры dev-helper'а `/auth/dev/telegram-sample`. Позволяют
 * получить несколько разных, но всегда валидно подписанных payload'ов
 * (разные `id` для сценария привязки второго Telegram-аккаунта) и
 * просроченный payload (для проверки отказа по `auth_date`) без ручного
 * пересчёта HMAC. См. docs/dev/telegram-auth-manual-testing.md.
 */
export class TelegramSampleQueryDto {
  @ApiPropertyOptional({
    description: 'Telegram id для сгенерированного payload (по умолчанию — фиксированный dev-id)',
    example: 555666777,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id?: number;

  @ApiPropertyOptional({ description: 'Имя в сгенерированном payload', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({
    description:
      'Сдвиг auth_date относительно текущего момента, секунды. Отрицательное значение ' +
      'имитирует просроченные данные виджета (проверка `isTelegramAuthFresh`).',
    example: -172800,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authDateOffsetSeconds?: number;
}
