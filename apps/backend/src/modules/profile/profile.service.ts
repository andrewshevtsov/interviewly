import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';
import type { UpdateProfileDto } from './dto/update-profile.dto.ts';
import { LeaderboardService } from '../leaderboard/leaderboard.service.ts';

// Сколько профилей с наибольшим рейтингом получают статус "top-rated" на витрине.
const TOP_RATED_COUNT = 3;

// Показывается вместо места в лидерборде, если пользователь туда не попал
// (нет ни одной завершённой сессии).
const NO_RANK_PLACEHOLDER = '—';

@Injectable()
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private leaderboardService: LeaderboardService,
  ) { }

  async create(createProfileDto: CreateProfileDto) {
    return this.profileRepository.create(createProfileDto);
  }

  async findAll() {
    return this.profileRepository.findAll();
  }

  /**
   * Витрина участников: профили с вычисленными статусом, числом завершённых
   * сессий и средним рейтингом по отзывам. Статус приоритетен сверху вниз:
   * "in-session" (сейчас в активной сессии) > "top-rated" (топ N по рейтингу
   * среди тех, у кого есть хотя бы одна завершённая сессия) > "available".
   */
  async findShowcase() {
    const profiles = await this.profileRepository.findAll();
    const userIds = profiles
      .map((profile) => profile.userId)
      .filter((userId): userId is string => userId !== null);

    const [sessionsCountByUserId, avgRatingByUserId, activeUserIds] = await Promise.all([
      this.profileRepository.countCompletedSessionsByUserIds(userIds),
      this.profileRepository.avgRatingByUserIds(userIds),
      this.profileRepository.findActiveSessionUserIds(userIds),
    ]);

    const topRatedUserIds = new Set(
      [...avgRatingByUserId.entries()]
        .filter(([userId]) => (sessionsCountByUserId.get(userId) ?? 0) > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_RATED_COUNT)
        .map(([userId]) => userId),
    );

    return profiles.map((profile) => {
      const userId = profile.userId;
      const sessionsCount = userId ? sessionsCountByUserId.get(userId) ?? 0 : 0;
      const avgRating = userId ? avgRatingByUserId.get(userId) ?? 0 : 0;

      const status = userId && activeUserIds.has(userId)
        ? 'in-session'
        : userId && topRatedUserIds.has(userId)
          ? 'top-rated'
          : 'available';

      return {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        level: profile.level,
        stack: profile.stack,
        bio: profile.bio ?? '',
        status,
        sessionsCount: String(sessionsCount),
        rating: `${avgRating.toFixed(1)}/10`,
      };
    });
  }

  /**
   * Статистика текущего пользователя для сайдбара личного кабинета: число
   * завершённых сессий, средний балл отзывов и место в лидерборде.
   */
  async findMyStats(userId: string) {
    const [profile, sessionsCountByUserId, avgRatingByUserId, ranked] = await Promise.all([
      this.profileRepository.findByUserId(userId),
      this.profileRepository.countCompletedSessionsByUserIds([userId]),
      this.profileRepository.avgRatingByUserIds([userId]),
      this.leaderboardService.findRanked(),
    ]);

    const interviews = sessionsCountByUserId.get(userId) ?? 0;
    const avgRating = avgRatingByUserId.get(userId) ?? 0;
    const myRankEntry = profile && ranked.find((entry) => entry.id === profile.id);

    return {
      interviews: String(interviews),
      avgRating: avgRating.toFixed(1),
      topRank: myRankEntry ? myRankEntry.rank : NO_RANK_PLACEHOLDER,
    };
  }

  async findOne(id: string) {
    const profile = await this.profileRepository.findOne(id);
    if (!profile) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }
    return profile;
  }

  async findByEmail(email: string) {
    const profile = await this.profileRepository.findByEmail(email);
    if (!profile) {
      throw new NotFoundException(`Profile with email ${email} not found`);
    }
    return profile;
  }

  /**
   * Возвращает профиль текущего пользователя или `null`, если он ещё не
   * заполнял анкету — в отличие от `findOne`/`findByEmail` это ожидаемая ветка.
   */
  async findByUserId(userId: string) {
    return this.profileRepository.findByUserId(userId);
  }

  /**
   * Создаёт или обновляет профиль текущего пользователя. `ProfileForm` на
   * фронтенде всегда отправляет анкету целиком, поэтому здесь нет отдельного
   * partial-патча — только create-or-replace по `userId`.
   */
  async upsertByUserId(userId: string, dto: CreateProfileDto) {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) {
      return this.profileRepository.update(existing.id, dto);
    }
    return this.profileRepository.create({ ...dto, userId });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);
    return this.profileRepository.update(id, updateProfileDto);
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.profileRepository.delete(id);
  }
}
