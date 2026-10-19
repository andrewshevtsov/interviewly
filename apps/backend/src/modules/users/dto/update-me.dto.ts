import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const emptyToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value);

const normalizeTelegramUsername = (value: unknown) => {
  const cleared = emptyToNull(value);
  return typeof cleared === 'string' ? cleared.trim().replace(/^@/, '') : cleared;
};

/**
 * Поля, которые пользователь может менять у себя сам. Права, статус, email и
 * пароль сюда намеренно не входят: ValidationPipe с `forbidNonWhitelisted`
 * отклонит запрос с любым из них.
 */
export class UpdateMeDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 255, example: 'Иван' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'Иванов', nullable: true })
  @Transform(({ value }: { value: unknown }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string | null;

  /**
   * Ник вводится вручную, уведомления в Telegram идут по `telegramId`, который меняется через вход по Tg.
   */
  @ApiPropertyOptional({ example: 'ivan_petrov', nullable: true, description: '5-32 символа: латиница, цифры, _' })
  @Transform(({ value }: { value: unknown }) => normalizeTelegramUsername(value))
  @IsOptional()
  @Matches(/^[A-Za-z0-9_]{5,32}$/, { message: 'telegramUsername must be 5-32 characters: latin letters, digits or _' })
  telegramUsername?: string | null;

  @ApiPropertyOptional({ maxLength: 64, example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}
