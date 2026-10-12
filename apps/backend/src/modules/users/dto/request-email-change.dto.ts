import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestEmailChangeDto {
  @ApiProperty({ format: 'email', example: 'new@example.com' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    description: 'Текущий пароль. Обязателен, если у аккаунта есть пароль; у вошедших через Telegram пароля нет.',
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @MaxLength(72)
  password?: string;
}
