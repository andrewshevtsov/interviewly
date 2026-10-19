// Демо-данные для примера роутинга (app/, app/sessions/*). Не часть FSD -
// живут рядом с роутами, которые их используют, а не в entities/shared.
import type { NewSessionDraft, SessionHistoryEntry } from "@/entities/session";
import type { Profile, ProfileStatsData } from "@/entities/profile";

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
  role: "Senior Frontend Engineer",
  level: "middle",
  stack: ["React", "TypeScript"],
  bio: "Гоняю по архитектуре фронта и алгоритмам. Люблю разбирать реальные кейсы.",
  showcaseVisible: true,
};

export const DEMO_PROFILE_STATS: ProfileStatsData = {
  interviews: "81",
  avgRating: "9.4",
  topRank: "04",
};

export const DEMO_NEW_SESSION_DRAFT: NewSessionDraft = {
  title: "Техническое интервью: скобочная последовательность",
  task: "Проверьте, что в строке из скобок ()[]{} все скобки закрыты в правильном порядке.",
  isPrivate: false,
  accessCode: "",
};
