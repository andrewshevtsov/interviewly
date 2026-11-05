import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TelegramLinkStartDto {
  @ApiPropertyOptional({ description: 'Внутренний путь сайта, куда вернуть пользователя после привязки', example: '/ru/profile' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnPath?: string;
}
