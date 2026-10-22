import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestHintDto {
  @ApiPropertyOptional({
    description:
      'Текущий код кандидата из редактора: даёт модели контекст. В промпт попадают первые 8000 символов.',
    maxLength: 20000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  code?: string;
}
