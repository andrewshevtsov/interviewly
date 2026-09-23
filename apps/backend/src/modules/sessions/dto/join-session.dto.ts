import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class JoinSessionDto {
  @ApiPropertyOptional({
    description: 'Пароль комнаты (только для access=PASSWORD, при первом join после approve)',
    minLength: 4,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
