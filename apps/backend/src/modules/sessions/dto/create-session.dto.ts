import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EditorLanguage,
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

const SESSION_TITLE_MAX_LENGTH = 120;

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Название сессии. Пустая строка после trim сохраняется как null.',
    maxLength: SESSION_TITLE_MAX_LENGTH,
    example: 'Техническое интервью: алгоритмы',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(SESSION_TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    enum: EditorLanguage,
    enumName: 'EditorLanguage',
    default: EditorLanguage.PYTHON,
  })
  @IsOptional()
  @IsEnum(EditorLanguage)
  editorLanguage?: EditorLanguage;

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
