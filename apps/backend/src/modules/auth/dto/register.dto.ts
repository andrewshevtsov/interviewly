import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя. Используется как логин и должен быть уникальным.',
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
}
