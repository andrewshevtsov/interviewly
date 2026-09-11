/** Languages supported by the application. */
export const SUPPORTED_LOCALES = ["ru", "en"] as const;

/** A language supported by the application. */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Language used when the requested language is unavailable. */
export const DEFAULT_LOCALE: Locale = "ru";

/** Cookie used to persist the selected language. */
export const LOCALE_COOKIE_NAME = "locale";

/** Request header populated from the locale URL segment. */
export const REQUEST_LOCALE_HEADER_NAME = "x-interviewly-locale";

const LOCALE_PATH_SEGMENT_INDEX = 1;

/** Translations of one message for every supported language. */
export type Translation = Record<Locale, string>;

/** A named group of translated messages. */
export type MessageGroup = Record<string, Translation>;

/** The complete application dictionary. */
export const messages = {
  common: {
    cancel: { ru: "отмена", en: "cancel" },
    save: { ru: "сохранить", en: "save" },
    loading: { ru: "Загрузка...", en: "Loading..." },
    email: { ru: "email", en: "email" },
    telegram: { ru: "telegram", en: "telegram" },
  },
  metadata: {
    description: {
      ru: "Сервис проведения технических и мок-интервью",
      en: "A platform for technical and mock interviews",
    },
  },
  navigation: {
    showcase: { ru: "витрина", en: "showcase" },
    leaderboard: { ru: "лидерборд", en: "leaderboard" },
    history: { ru: "история", en: "history" },
    profile: { ru: "кабинет", en: "profile" },
    signIn: { ru: "войти", en: "sign in" },
    createSession: { ru: "создать сессию", en: "create session" },
  },
  auth: {
    login: { ru: "войти", en: "sign in" },
    loginTab: { ru: "вход", en: "sign in" },
    registerTab: { ru: "регистрация", en: "sign up" },
    register: { ru: "создать аккаунт", en: "create account" },
    password: { ru: "пароль", en: "password" },
    confirmPassword: { ru: "повторите пароль", en: "confirm password" },
    fullName: { ru: "имя и фамилия", en: "full name" },
    fullNamePlaceholder: { ru: "Артём Соколов", en: "John Doe" },
    emailPlaceholder: { ru: "you@company.dev", en: "you@company.dev" },
    passwordPlaceholder: { ru: "••••••••", en: "••••••••" },
    or: { ru: "или", en: "or" },
    continueWithTelegram: {
      ru: "продолжить через Telegram",
      en: "continue with Telegram",
    },
    agreementPrefix: {
      ru: "Продолжая, вы соглашаетесь с",
      en: "By continuing, you agree to the",
    },
    termsOfService: { ru: "условиями сервиса", en: "terms of service" },
  },
  hero: {
    titleStart: { ru: "Проведи", en: "Run a" },
    titleAccent: { ru: "техническое", en: "technical" },
    titleEnd: { ru: "интервью.", en: "interview." },
    description: {
      ru:
        "Живой кодинг вдвоём, камера, AI-подсказки и честная обратная связь. " +
        "Для работодателей и для тех, кто готовится к офферу.",
      en: "Live pair coding, video, AI hints, and honest feedback. For employers and candidates preparing for an offer.",
    },
    editorTitle: { ru: "интервью", en: "interview" },
    realtimeSyncComment: {
      ru: "синхронизация в реальном времени",
      en: "real-time synchronization",
    },
  },
  showcase: {
    title: { ru: "витрина участников", en: "participant showcase" },
    description: {
      ru: "Найдите партнёра для пробного интервью по стеку и уровню.",
      en: "Find a mock interview partner by technology stack and level.",
    },
    allCards: { ru: "все карточки", en: "all profiles" },
    respond: { ru: "откликнуться", en: "respond" },
    available: { ru: "свободен", en: "available" },
    inSession: { ru: "на сессии", en: "in session" },
    topRated: { ru: "топ рейтинга", en: "top rated" },
  },
  leaderboard: {
    title: { ru: "лидерборд", en: "leaderboard" },
    description: {
      ru: "Топ участников по количеству проведённых интервью.",
      en: "Top participants by number of completed interviews.",
    },
    sessions: { ru: "сессий", en: "sessions" },
    rating: { ru: "рейтинг", en: "rating" },
  },
  profile: {
    title: { ru: "личный кабинет", en: "profile" },
    description: {
      ru: "Профиль и карточка, которую видят другие участники.",
      en: "Your profile and the card visible to other participants.",
    },
    fullName: { ru: "имя и фамилия", en: "full name" },
    role: { ru: "роль", en: "role" },
    level: { ru: "уровень", en: "level" },
    junior: { ru: "junior", en: "junior" },
    middle: { ru: "middle", en: "middle" },
    senior: { ru: "senior", en: "senior" },
    stack: { ru: "стек", en: "stack" },
    bio: { ru: "о себе (текст карточки)", en: "about you (profile text)" },
    saveChanges: { ru: "сохранить изменения", en: "save changes" },
    statistics: { ru: "статистика", en: "statistics" },
    interviews: { ru: "интервью", en: "interviews" },
    averageRating: { ru: "средняя оценка", en: "average rating" },
    leaderboardPlace: { ru: "место в топе", en: "leaderboard place" },
  },
  theme: {
    enableLight: { ru: "Включить светлую тему", en: "Enable light theme" },
    enableDark: { ru: "Включить тёмную тему", en: "Enable dark theme" },
  },
  notification: {
    telegramTitle: { ru: "Telegram-уведомления", en: "Telegram notifications" },
    telegramDescription: {
      ru: "Бот пришлёт сообщение, когда сессия будет запущена или на вашу карточку откликнутся.",
      en: "The bot will message you when a session starts or someone responds to your profile.",
    },
  },
  session: {
    title: { ru: "сессия интервью", en: "interview session" },
    sessionsTitle: { ru: "сессии", en: "sessions" },
    backToSessions: { ru: "назад к сессиям", en: "back to sessions" },
    canJoin: {
      ru: "Вы можете присоединиться к этой сессии.",
      en: "You can join this session.",
    },
    cannotJoin: {
      ru: "К этой сессии нельзя присоединиться.",
      en: "This session cannot be joined.",
    },
    hintsLeft: { ru: "осталось подсказок", en: "hints left" },
    sessionLevel: { ru: "уровень сессии", en: "session level" },
    scheduled: { ru: "запланирована", en: "scheduled" },
    active: { ru: "активна", en: "active" },
    completed: { ru: "завершена", en: "completed" },
    interviewerVideo: { ru: "видео интервьюера", en: "interviewer video" },
    candidateVideo: { ru: "видео кандидата", en: "candidate video" },
    interviewer: { ru: "интервьюер", en: "interviewer" },
    you: { ru: "вы", en: "you" },
    aiHint: { ru: "AI-подсказка", en: "AI hint" },
    aiHintExample: {
      ru: "Подумайте о сложности поиска в неотсортированном массиве против хеш-таблицы…",
      en: "Consider the search complexity of an unsorted array versus a hash table…",
    },
    autosaving: { ru: "Автосохранение...", en: "Autosaving..." },
    synced: { ru: "синхронизировано", en: "synced" },
    exampleTask: {
      ru: "Задача: развернуть связный список на месте",
      en: "Task: reverse a linked list in place",
    },
    waitingForExplanation: {
      ru: "Ждём объяснение решения от кандидата…",
      en: "Waiting for the candidate to explain the solution…",
    },
    sessionId: { ru: "ID сессии", en: "session ID" },
    openRoom: { ru: "открыть комнату", en: "open room" },
  },
  interview: {
    joinButton: { ru: "присоединиться", en: "join" },
    leaveButton: { ru: "покинуть", en: "leave" },
    sessionNotFound: { ru: "Сессия не найдена", en: "Session not found" },
  },
  footer: {
    privacy: { ru: "приватность", en: "privacy" },
    terms: { ru: "условия", en: "terms" },
    telegramBot: { ru: "Telegram-бот", en: "Telegram bot" },
    copyright: {
      ru: "технологическая платформа Interviewly",
      en: "Interviewly technology platform",
    },
  },
} as const satisfies Record<string, MessageGroup>;

/** A top-level section of the dictionary. */
export type MessageGroupName = keyof typeof messages;

/** A valid message name from the selected dictionary group. */
export type MessageKey<Group extends MessageGroupName> = keyof (typeof messages)[Group];

/** A translator restricted to one dictionary group. */
export type Translator<Group extends MessageGroupName> = <Key extends MessageKey<Group>>(
  key: Key,
) => string;

/**
 * Checks whether a value is one of the supported languages.
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value is a supported locale.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.some((locale) => locale === value);
}

/**
 * Returns a supported language or the default one.
 * @param {unknown} value - Locale candidate.
 * @returns {Locale} Valid application locale.
 */
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Prefixes an internal application URL with the selected language.
 * @param {string} href - Internal URL or page fragment.
 * @param {Locale} locale - Language to add to the URL.
 * @returns {string} Locale-aware URL.
 */
export function getLocalizedHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const segments = href.split("/");

  if (isLocale(segments[LOCALE_PATH_SEGMENT_INDEX])) {
    segments[LOCALE_PATH_SEGMENT_INDEX] = locale;

    return segments.join("/");
  }

  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/**
 * Returns a translated message from the dictionary.
 * @param {string} group - Dictionary section.
 * @param {string} key - Message name within the section.
 * @param {Locale} locale - Language of the returned message.
 * @returns {string} Translated message.
 */
export function getMessage<Group extends MessageGroupName, Key extends MessageKey<Group>>(
  group: Group,
  key: Key,
  locale: Locale,
): string {
  const messageGroup: MessageGroup = messages[group];
  const translation = messageGroup[String(key)];

  if (!translation) {
    throw new Error(`Unknown message: ${group}.${String(key)}`);
  }

  return translation[locale];
}

/**
 * Creates a translator bound to a language and dictionary group.
 * @param {string} group - Dictionary section.
 * @param {Locale} locale - Language of returned messages.
 * @returns {Translator} Translator for the selected group.
 */
export function createTranslator<Group extends MessageGroupName>(
  group: Group,
  locale: Locale,
): Translator<Group> {
  return (key) => getMessage(group, key, locale);
}
