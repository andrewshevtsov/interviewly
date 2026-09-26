// Демо-данные для примера роутинга (app/, app/sessions/*). Не часть FSD -
// живут рядом с роутами, которые их используют, а не в entities/shared.
import type { NewSessionDraft, SessionHistoryEntry } from "@/entities/session";
import type { Profile } from "@/entities/profile";

export const DEMO_SESSION_HISTORY: SessionHistoryEntry[] = [
  {
    id: "abcdef123456",
    number: "4092",
    role: "candidate",
    title: "Алгоритмы: связные списки",
    partnerName: "Мария Лебедева",
    date: "2026-08-18T12:00:00.000Z",
    durationMinutes: 48,
    score: 8,
    scoreMax: 10,
  },
  {
    id: "a1b2c3d4e5f6",
    number: "4071",
    role: "interviewer",
    title: "System design: сервис нотификаций",
    partnerName: "Марк Ченов",
    date: "2026-08-12T12:00:00.000Z",
    durationMinutes: 62,
    score: 9,
    scoreMax: 10,
  },
  {
    id: "112233445566",
    number: "3980",
    role: "candidate",
    title: "SQL и индексы",
    partnerName: "Елена Волкова",
    date: "2026-08-03T12:00:00.000Z",
    durationMinutes: 41,
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

export const DEMO_NEW_SESSION_DRAFT: NewSessionDraft = {
  title: "Техническое интервью: алгоритмы",
  editorLanguage: "python",
  isPrivate: true,
  accessCode: "SECURE-77-X9",
};
