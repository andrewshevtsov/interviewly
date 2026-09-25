import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferOwnershipDto {
  @ApiProperty({
    description: 'UUID интервьюера этой сессии, который станет новым владельцем',
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;
}
