import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { LeaderboardController } from './leaderboard.controller.ts';
import { LeaderboardRepository } from './leaderboard.repository.ts';
import { LeaderboardService } from './leaderboard.service.ts';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardRepository],
})
export class LeaderboardModule {}
