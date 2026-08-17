// Слой entities: описывает бизнес-сущность "сессия интервью".
// Разрешено импортировать из shared.
import { formatLevel } from "@/shared/lib/format-level";
import { SESSION_ID_LENGTH } from "@/shared/config/constants";

export interface InterviewSession {
  id: string;
  title: string;
  status: "scheduled" | "active" | "completed";
}

export function isValidSessionId(id: string): boolean {
  return id.length === SESSION_ID_LENGTH;
}

export function describeSessionLevel(level: string): string {
  return formatLevel(level);
}
