import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  REJECTION_REASON_MAX_LENGTH,
  REJECTION_REASON_MIN_LENGTH,
} from '../showcase.constants.ts';

export class RejectShowcaseResponseDto {
  @ApiProperty({
    description: 'Причина отказа: её увидит откликнувшийся. Длина считается после trim.',
    minLength: REJECTION_REASON_MIN_LENGTH,
    maxLength: REJECTION_REASON_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(REJECTION_REASON_MIN_LENGTH)
  @MaxLength(REJECTION_REASON_MAX_LENGTH)
  reason!: string;

  @ApiPropertyOptional({
    description:
      'Отказ только из-за времени: пауза перед повторным откликом не действует, можно сразу предложить другое время',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  timeMismatch?: boolean;
}
