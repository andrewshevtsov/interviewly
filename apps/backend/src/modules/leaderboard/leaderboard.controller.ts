import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto.ts';
import { LeaderboardEntryResponse } from './entities/leaderboard-entry.entity.ts';
import { LeaderboardService } from './leaderboard.service.ts';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // Без JwtAuthGuard: страницу рендерит сервер Next.js, у которого нет токена пользователя
  @Get()
  @ApiOperation({
    summary:
      'Публичный топ участников по числу завершённых интервью; оценки из отзывов не учитываются',
  })
  getTop(@Query() query: LeaderboardQueryDto): Promise<LeaderboardEntryResponse[]> {
    return this.leaderboardService.getTop(query.limit);
  }
}
