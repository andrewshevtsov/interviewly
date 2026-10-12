import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailChangeDto {
  @ApiProperty({ description: 'Токен из ссылки в письме' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  token!: string;
}
