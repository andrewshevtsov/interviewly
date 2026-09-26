import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service.ts';
import { LeaderboardController } from './leaderboard.controller.ts';
import { LeaderboardRepository } from './leaderboard.repository.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardRepository],
  exports: [LeaderboardService],
})
export class LeaderboardModule { }
