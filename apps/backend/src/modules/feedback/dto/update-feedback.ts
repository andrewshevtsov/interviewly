import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeedbackDto {
  @ApiProperty({
    description: 'Оценка от 0 до 10',
    example: 8,
    minimum: 0,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  score?: number;

  @ApiProperty({
    description: 'Текстовый отзыв',
    example: 'Хорошо решает задачи, стоит подтянуть коммуникацию',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
