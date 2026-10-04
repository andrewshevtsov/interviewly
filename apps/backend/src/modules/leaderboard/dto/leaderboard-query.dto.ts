import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const DEFAULT_LEADERBOARD_LIMIT = 20;
export const MAX_LEADERBOARD_LIMIT = 100;

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Сколько участников вернуть',
    minimum: 1,
    maximum: MAX_LEADERBOARD_LIMIT,
    default: DEFAULT_LEADERBOARD_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LEADERBOARD_LIMIT)
  limit: number = DEFAULT_LEADERBOARD_LIMIT;
}
