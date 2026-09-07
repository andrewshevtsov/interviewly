import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  // bcrypt учитывает только первые 72 байта пароля — ограничиваем явно.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;
}
