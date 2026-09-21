import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'Идентификатор участника сессии, о котором оставляется отзыв',
    example: '5b6f3c2e-9c1a-4b8e-9d3a-2f6b1c4d7e8a',
  })
  @IsUUID()
  targetUserId!: string;

  @ApiProperty({
    description: 'Оценка от 0 до 10',
    example: 8,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  score!: number;

  @ApiProperty({
    description: 'Текстовый отзыв (необязательно)',
    example: 'Хорошо решает задачи, стоит подтянуть коммуникацию',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
