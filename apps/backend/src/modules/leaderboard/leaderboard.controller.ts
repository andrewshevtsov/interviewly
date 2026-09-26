import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service.ts';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) { }

  @Get()
  @ApiOperation({ summary: 'Рейтинг профилей по среднему баллу отзывов' })
  findRanked() {
    return this.leaderboardService.findRanked();
  }
}
