import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ maxLength: 255, example: 'Иванов' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ maxLength: 64, example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}
