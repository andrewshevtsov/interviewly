import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { LeaderboardRepository, LeaderboardRow } from './leaderboard.repository.ts';
import { LeaderboardService } from './leaderboard.service.ts';

const row = (overrides: Partial<LeaderboardRow>): LeaderboardRow => ({
  userId: 'user',
  firstName: 'Ivan',
  lastName: null,
  role: null,
  interviewsCount: 1,
  ...overrides,
});

describe('LeaderboardService', () => {
  let repository: Mocked<LeaderboardRepository>;
  let service: LeaderboardService;

  beforeEach(() => {
    repository = { findTop: vi.fn() } as unknown as Mocked<LeaderboardRepository>;
    service = new LeaderboardService(repository);
  });

  it('нумерует места по порядку из репозитория и передаёт лимит', async () => {
    repository.findTop.mockResolvedValue([
      row({ userId: 'a', interviewsCount: 5 }),
      row({ userId: 'b', interviewsCount: 3 }),
    ]);

    const entries = await service.getTop(2);

    expect(repository.findTop).toHaveBeenCalledWith(2);
    expect(entries.map((entry) => [entry.rank, entry.userId])).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('склеивает имя с фамилией и пропускает пустую фамилию', async () => {
    repository.findTop.mockResolvedValue([
      row({ firstName: 'Ivan', lastName: 'Petrov' }),
      row({ firstName: 'Clara', lastName: null }),
    ]);

    const [full, short] = await service.getTop(20);

    expect(full?.name).toBe('Ivan Petrov');
    expect(short?.name).toBe('Clara');
  });

  it('отдаёт только место, участника и число интервью - без оценок', async () => {
    repository.findTop.mockResolvedValue([row({ userId: 'a', role: 'Fullstack Dev', interviewsCount: 4 })]);

    const [entry] = await service.getTop(20);

    expect(entry).toEqual({
      rank: 1,
      userId: 'a',
      name: 'Ivan',
      role: 'Fullstack Dev',
      interviewsCount: 4,
    });
  });

  it('пустой лидерборд - пустой список', async () => {
    repository.findTop.mockResolvedValue([]);

    expect(await service.getTop(20)).toEqual([]);
  });
});
