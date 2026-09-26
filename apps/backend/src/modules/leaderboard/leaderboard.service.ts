import { Injectable } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository.ts';

@Injectable()
export class LeaderboardService {
  constructor(private readonly leaderboardRepository: LeaderboardRepository) { }

  /**
   * Ранжирует профили по среднему рейтингу отзывов (по числу завершённых
   * сессий как тай-брейку). В зачёт идут только те, у кого есть хотя бы одна
   * завершённая сессия — иначе не по чему ранжировать.
   */
  async findRanked() {
    const profiles = await this.leaderboardRepository.findProfilesWithUser();
    const userIds = profiles.map((profile) => profile.userId as string);

    const [sessionsCountByUserId, avgRatingByUserId] = await Promise.all([
      this.leaderboardRepository.countCompletedSessionsByUserIds(userIds),
      this.leaderboardRepository.avgRatingByUserIds(userIds),
    ]);

    const ranked = profiles
      .map((profile) => ({
        profile,
        sessionsCount: sessionsCountByUserId.get(profile.userId as string) ?? 0,
        avgRating: avgRatingByUserId.get(profile.userId as string) ?? 0,
      }))
      .filter((entry) => entry.sessionsCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating || b.sessionsCount - a.sessionsCount);

    return ranked.map((entry, index) => ({
      id: entry.profile.id,
      rank: String(index + 1).padStart(2, '0'),
      name: entry.profile.name,
      role: entry.profile.role,
      sessionsCount: String(entry.sessionsCount),
      rating: entry.avgRating.toFixed(1),
    }));
  }
}
