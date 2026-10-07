import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const CANCEL_REASON_MAX_LENGTH = 500;

export class CancelSessionDto {
  @ApiPropertyOptional({
    description: 'Причину отмены видит второй участник.',
    maxLength: CANCEL_REASON_MAX_LENGTH,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(CANCEL_REASON_MAX_LENGTH)
  reason?: string;
}
