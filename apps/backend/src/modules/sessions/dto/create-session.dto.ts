import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SessionAccess,
  SessionParticipantRole,
  SessionType,
} from '../../../prisma/generated/enums.ts';

export class CreateSessionParticipantDto {
  @ApiProperty({
    description: 'UUID пользователя, которого приглашают в сессию',
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Роль участника в LiveKit-комнате',
    enum: SessionParticipantRole,
    enumName: 'SessionParticipantRole',
    default: SessionParticipantRole.CANDIDATE,
  })
  @IsOptional()
  @IsEnum(SessionParticipantRole)
  role?: SessionParticipantRole;
}

export class CreateSessionDto {
  @ApiPropertyOptional({
    enum: SessionType,
    enumName: 'SessionType',
    default: SessionType.BUSINESS,
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    enum: SessionAccess,
    enumName: 'SessionAccess',
    default: SessionAccess.INVITE,
  })
  @IsOptional()
  @IsEnum(SessionAccess)
  access?: SessionAccess;

  @ApiPropertyOptional({
    description: 'Сырой пароль; хешируется на сервере. Обязателен при access=PASSWORD.',
    minLength: 4,
    example: 'secret-room',
  })
  @ValidateIf((dto: CreateSessionDto) => dto.access === SessionAccess.PASSWORD)
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({
    description: 'Запланированное время старта (ISO-8601)',
    example: '2026-09-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Предварительный список участников (кроме владельца)',
    type: [CreateSessionParticipantDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionParticipantDto)
  participants?: CreateSessionParticipantDto[];
}
