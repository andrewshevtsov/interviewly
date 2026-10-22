import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email пользователя',
    format: 'email',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Пароль пользователя. bcrypt учитывает только первые 72 байта, поэтому длина ограничена явно.',
    format: 'password',
    minLength: 8,
    maxLength: 72,
    example: 'P@ssw0rd123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    description:
      'Запомнить вход: true - постоянная кука с refresh-токеном, false - сессионная. По умолчанию true.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
