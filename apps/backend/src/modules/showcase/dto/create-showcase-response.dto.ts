import { IsEnum, IsISO8601, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SessionParticipantRole } from '../../../prisma/generated/enums.ts';
import { MAX_LEAD_DAYS, MIN_LEAD_HOURS } from '../showcase.constants.ts';

export class CreateShowcaseResponseDto {
  @ApiProperty({
    description:
      'Роль, в которой откликающийся хочет прийти на встречу; владелец карточки получит противоположную',
    enum: SessionParticipantRole,
    enumName: 'SessionParticipantRole',
  })
  @IsEnum(SessionParticipantRole)
  role!: SessionParticipantRole;

  @ApiProperty({
    description: `Предлагаемое начало встречи, ISO-8601 с часовым поясом. От ${MIN_LEAD_HOURS} часов до ${MAX_LEAD_DAYS} дней от текущего момента`,
    example: '2026-10-12T15:00:00+04:00',
  })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, { message: 'scheduledAt must include a timezone offset or Z' })
  scheduledAt!: string;
}
