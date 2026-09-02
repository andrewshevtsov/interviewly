// Демо-данные для примера роутинга (app/, app/sessions/*). Не часть FSD -
// живут рядом с роутами, которые их используют, а не в entities/shared.
import type { User } from "@/entities/user";
import type { InterviewSession } from "@/entities/session";
import type { Profile, ProfileStatsData } from "@/entities/profile";

export const DEMO_USER: User = {
  id: "u-1",
  displayName: "John Doe",
  stack: ["TypeScript", "React"],
  level: "Senior",
};

export const DEMO_SESSIONS: InterviewSession[] = [
  {
    id: "abcdef123456",
    title: "Frontend deep dive",
    status: "scheduled",
  },
  {
    id: "a1b2c3d4e5f6",
    title: "System design",
    status: "active",
  },
  {
    id: "112233445566",
    title: "Algorithms warm-up",
    status: "completed",
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
