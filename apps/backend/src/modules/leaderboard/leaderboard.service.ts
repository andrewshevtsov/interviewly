import { Injectable } from '@nestjs/common';
import { LeaderboardEntryResponse } from './entities/leaderboard-entry.entity.ts';
import { LeaderboardRepository, type LeaderboardRow } from './leaderboard.repository.ts';

@Injectable()
export class LeaderboardService {
  constructor(private readonly repository: LeaderboardRepository) {}

  async getTop(limit: number): Promise<LeaderboardEntryResponse[]> {
    const rows = await this.repository.findTop(limit);
    return rows.map((row, index) => this.toEntry(row, index + 1));
  }

  private toEntry(row: LeaderboardRow, rank: number): LeaderboardEntryResponse {
    return new LeaderboardEntryResponse({
      rank,
      userId: row.userId,
      name: [row.firstName, row.lastName].filter(Boolean).join(' '),
      role: row.role,
      interviewsCount: row.interviewsCount,
    });
  }
}
