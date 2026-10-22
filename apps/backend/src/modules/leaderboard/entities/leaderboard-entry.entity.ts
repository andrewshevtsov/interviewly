/** Строка лидерборда: место участника и сколько интервью он прошёл */
export class LeaderboardEntryResponse {
  /** Место в рейтинге, начиная с 1 */
  rank!: number;
  userId!: string;
  name!: string;
  /** Роль из профиля (например, "Fullstack Dev"); `null`, если профиля нет */
  role!: string | null;
  /** Завершённые интервью, в которых участник был - интервьюером или кандидатом */
  interviewsCount!: number;

  constructor(partial: LeaderboardEntryResponse) {
    Object.assign(this, partial);
  }
}
