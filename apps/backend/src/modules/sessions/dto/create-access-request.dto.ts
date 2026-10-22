import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionParticipantRole } from '../../../prisma/generated/enums.ts';

export class CreateAccessRequestDto {
  @ApiPropertyOptional({
    description: 'Пароль комнаты (обязателен при access=PASSWORD)',
    minLength: 4,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({
    description: 'Желаемая роль после одобрения',
    enum: SessionParticipantRole,
    enumName: 'SessionParticipantRole',
    default: SessionParticipantRole.CANDIDATE,
  })
  @IsOptional()
  @IsEnum(SessionParticipantRole)
  role?: SessionParticipantRole;
}
