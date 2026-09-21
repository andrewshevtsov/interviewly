// Демо-данные для примера роутинга (app/, app/sessions/*). Не часть FSD -
// живут рядом с роутами, которые их используют, а не в entities/shared.
import type { User } from "@/entities/user";
import type { NewSessionDraft, SessionHistoryEntry } from "@/entities/session";
import type { Profile, ProfileStatsData } from "@/entities/profile";
import type { Participant } from "@/entities/participant";
import type { LeaderboardEntry } from "@/entities/leaderboard";

export const DEMO_USER: User = {
  id: "u-1",
  displayName: "John Doe",
  stack: ["TypeScript", "React"],
  level: "Senior",
};

export const DEMO_SESSION_HISTORY: SessionHistoryEntry[] = [
  {
    id: "abcdef123456",
    number: "4092",
    role: "candidate",
    title: "Алгоритмы: связные списки",
    partnerName: "Мария Лебедева",
    date: "18 августа 2026",
    duration: "48 мин",
    hintsUsed: 1,
    hintsTotal: 3,
    score: 8,
    scoreMax: 10,
  },
  {
    id: "a1b2c3d4e5f6",
    number: "4071",
    role: "interviewer",
    title: "System design: сервис нотификаций",
    partnerName: "Марк Ченов",
    date: "12 августа 2026",
    duration: "62 мин",
    hintsUsed: 0,
    hintsTotal: 3,
    score: 9,
    scoreMax: 10,
  },
  {
    id: "112233445566",
    number: "3980",
    role: "candidate",
    title: "SQL и индексы",
    partnerName: "Елена Волкова",
    date: "3 августа 2026",
    duration: "41 мин",
    hintsUsed: 3,
    hintsTotal: 3,
    score: 6,
    scoreMax: 10,
  },
];

export const DEMO_PROFILE: Profile = {
  name: "Артём Соколов",
  role: "Senior Frontend Engineer",
  email: "artem@syntax.dev",
  telegram: "@artem_dev",
  level: "middle",
  stack: ["React", "TypeScript"],
  bio: "Гоняю по архитектуре фронта и алгоритмам. Люблю разбирать реальные кейсы.",
};

export const DEMO_PROFILE_STATS: ProfileStatsData = {
  interviews: "81",
  avgRating: "9.4",
  topRank: "04",
};

export const DEMO_NEW_SESSION_DRAFT: NewSessionDraft = {
  title: "Техническое интервью: алгоритмы",
  editorLanguage: "python",
  isPrivate: true,
  accessCode: "SECURE-77-X9",
  inviteLink: "https://syntax.dev/session/4092",
};

export const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: "p-1",
    name: "Артём Соколов",
    role: "Senior Frontend Engineer",
    level: "senior",
    stack: ["React", "TypeScript", "Next.js"],
    bio: "Гоняю по архитектуре фронта и алгоритмам. Люблю разбирать реальные кейсы.",
    status: "available",
    sessionsCount: "42",
    rating: "9.4/10",
  },
  {
    id: "p-2",
    name: "Елена Волкова",
    role: "Backend Specialist",
    level: "middle",
    stack: ["Python", "Go", "PostgreSQL"],
    bio: "Спрошу про индексы, транзакции и очереди. Даю подробную обратную связь.",
    status: "in-session",
    sessionsCount: "31",
    rating: "9.1/10",
  },
  {
    id: "p-3",
    name: "Марк Ченов",
    role: "Full Stack Developer",
    level: "senior",
    stack: ["Node.js", "Docker", "Kubernetes"],
    bio: "System design и инфраструктура. Готов к жёсткому мок-интервью.",
    status: "top-rated",
    sessionsCount: "87",
    rating: "9.8/10",
  },
  {
    id: "p-4",
    name: "Игорь Мельник",
    role: "Frontend Developer",
    level: "junior",
    stack: ["React", "TypeScript"],
    bio: "Готовлюсь к первому офферу, ищу партнёра для регулярной практики.",
    status: "available",
    sessionsCount: "9",
    rating: "8.2/10",
  },
  {
    id: "p-5",
    name: "Мария Лебедева",
    role: "Systems Engineer",
    level: "senior",
    stack: ["Rust", "Go", "Docker"],
    bio: "Память, конкурентность, производительность. Разберём низкий уровень.",
    status: "available",
    sessionsCount: "54",
    rating: "9.6/10",
  },
  {
    id: "p-6",
    name: "Дмитрий Кузьмин",
    role: "Data / Backend",
    level: "middle",
    stack: ["Python", "PostgreSQL", "Docker"],
    bio: "SQL-задачи, ETL, немного алгоритмов. Спокойный формат без давления.",
    status: "available",
    sessionsCount: "23",
    rating: "8.9/10",
  },
];

export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "l-1",
    rank: "01",
    name: "Марк Ченов",
    role: "Senior Architect",
    sessionsCount: "142",
    rating: "9.9",
  },
  {
    id: "l-2",
    rank: "02",
    name: "София Родригес",
    role: "Fullstack Dev",
    sessionsCount: "128",
    rating: "9.7",
  },
  {
    id: "l-3",
    rank: "03",
    name: "Мария Лебедева",
    role: "Systems Engineer",
    sessionsCount: "95",
    rating: "9.5",
  },
  {
    id: "l-4",
    rank: "04",
    name: "Артём Соколов",
    role: "Senior Frontend",
    sessionsCount: "81",
    rating: "9.4",
  },
  {
    id: "l-5",
    rank: "05",
    name: "Дмитрий Кузьмин",
    role: "Backend Engineer",
    sessionsCount: "63",
    rating: "8.9",
  },
  {
    id: "l-6",
    rank: "06",
    name: "Елена Волкова",
    role: "Backend Specialist",
    sessionsCount: "47",
    rating: "9.1",
  },
  {
    id: "l-7",
    rank: "07",
    name: "Игорь Мельник",
    role: "Frontend Developer",
    sessionsCount: "22",
    rating: "8.2",
  },
];
