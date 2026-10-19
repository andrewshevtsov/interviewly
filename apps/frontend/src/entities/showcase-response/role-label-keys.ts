// Слой entities: ключи переводов названий ролей отклика
import type { ShowcaseRole } from "./index";

/**
 * Ключ перевода названия роли в группе "showcaseResponses".
 */
export const ROLE_LABEL_KEYS = {
  INTERVIEWER: "roleInterviewer",
  CANDIDATE: "roleCandidate",
} as const satisfies Record<ShowcaseRole, string>;
