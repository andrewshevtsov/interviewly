import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShowcaseResponseStatus } from '../../../prisma/generated/enums.ts';

export class IncomingResponsesQueryDto {
  @ApiPropertyOptional({
    description: 'Только отклики с этим статусом (регистр не важен); без параметра - все',
    enum: ShowcaseResponseStatus,
    enumName: 'ShowcaseResponseStatus',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(ShowcaseResponseStatus)
  status?: ShowcaseResponseStatus;
}
