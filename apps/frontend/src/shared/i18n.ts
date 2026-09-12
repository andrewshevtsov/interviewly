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
const FIRST_CHARACTER_COUNT = 1;

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
    pageDescription: {
      ru: "Создайте свою карточку или откликнитесь на чужую — сессия создастся автоматически.",
      en: "Create your own profile or respond to someone else's — the session is created automatically.",
    },
    myCard: { ru: "моя карточка", en: "my profile" },
    searchLabel: { ru: "поиск", en: "search" },
    searchPlaceholder: { ru: "Имя, роль или стек...", en: "Name, role or stack..." },
    foundCount: { ru: "найдено карточек", en: "profiles found" },
  },
  leaderboard: {
    title: { ru: "лидерборд", en: "leaderboard" },
    description: {
      ru: "Топ участников по количеству проведённых интервью.",
      en: "Top participants by number of completed interviews.",
    },
    sessions: { ru: "сессий", en: "sessions" },
    rating: { ru: "рейтинг", en: "rating" },
    participantColumn: { ru: "участник", en: "participant" },
    interviewsColumn: { ru: "интервью", en: "interviews" },
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
    candidate: { ru: "кандидат", en: "candidate" },
    sessionLabel: { ru: "сессия", en: "session" },
    historyTitle: { ru: "История интервью", en: "Interview history" },
    historyDescription: {
      ru: "Ваши сессии, оценки и личные заметки.",
      en: "Your sessions, scores and personal notes.",
    },
    hintsUsedLabel: { ru: "подсказок", en: "hints used" },
    scoreOutOf: { ru: "из", en: "out of" },
    recording: { ru: "запись", en: "recording" },
    endSession: { ru: "завершить", en: "end session" },
    participantsSuffix: { ru: "участника", en: "participants" },
    outputLabel: { ru: "вывод", en: "output" },
    syntaxHint: {
      ru: "Подсветка синтаксиса и автокомплит включены.",
      en: "Syntax highlighting and autocomplete are enabled.",
    },
    running: { ru: "Выполняется…", en: "Running…" },
    runCode: { ru: "запустить код", en: "run code" },
  },
  newSession: {
    title: { ru: "новая сессия", en: "new session" },
    description: {
      ru: "Настройте комнату и пригласите участников.",
      en: "Configure the room and invite participants.",
    },
    sessionTitleLabel: { ru: "название", en: "title" },
    editorLanguageLabel: { ru: "язык редактора", en: "editor language" },
    privateSession: { ru: "закрытая сессия", en: "private session" },
    privateSessionHint: {
      ru: "Вход только по паролю.",
      en: "Access requires the code below.",
    },
    inviteLinkLabel: { ru: "ссылка-приглашение", en: "invite link" },
    copy: { ru: "копировать", en: "copy" },
    copied: { ru: "скопировано", en: "copied" },
    telegramNotice: {
      ru: "Всем приглашённым Telegram-бот пришлёт уведомление о запуске сессии.",
      en: "The Telegram bot will notify every invitee when the session starts.",
    },
    launchSession: { ru: "запустить сессию", en: "launch session" },
  },
  feedback: {
    title: { ru: "обратная связь", en: "feedback" },
    scoreLabel: { ru: "оценка", en: "score" },
    completedNotice: {
      ru: "завершена. Заметки видны только вам.",
      en: "is complete. Notes are visible only to you.",
    },
    strengthsLabel: { ru: "что получилось хорошо", en: "what went well" },
    strengthsPlaceholder: {
      ru: "Чистый код, проговаривал ход мыслей...",
      en: "Clean code, talked through the thought process...",
    },
    growthAreasLabel: { ru: "зоны роста", en: "areas to grow" },
    growthAreasPlaceholder: {
      ru: "Крайние случаи, оценка сложности...",
      en: "Edge cases, complexity analysis...",
    },
    notesLabel: { ru: "личные заметки", en: "personal notes" },
    notesPlaceholder: {
      ru: "Что повторить перед следующим интервью...",
      en: "What to review before the next interview...",
    },
    saving: { ru: "Сохраняем…", en: "Saving…" },
    saveResult: { ru: "сохранить результат", en: "save result" },
    backToHistory: { ru: "к истории", en: "back to history" },
  },
  interview: {
    joinButton: { ru: "присоединиться", en: "join" },
    leaveButton: { ru: "покинуть", en: "leave" },
    sessionNotFound: { ru: "Сессия не найдена", en: "Session not found" },
    cannotOpenSession: {
      ru: "Эту сессию нельзя открыть — проверьте ссылку.",
      en: "This session can't be opened — check the link.",
    },
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
export interface Translator<Group extends MessageGroupName> {
  <Key extends MessageKey<Group>>(key: Key): string;

  /**
   * Returns the message as written in the dictionary, without the automatic leading-capital
   * applied by the default call. Only for values that must keep their exact casing (e.g. an
   * email example) or that continue a sentence started by another translated string.
   */
  raw<Key extends MessageKey<Group>>(key: Key): string;
}

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
 * Capitalizes the first letter of a string, leaving the rest untouched. Locale-aware so it
 * behaves correctly for every supported language, not just ASCII text.
 * @param {string} text - Text to capitalize.
 * @param {Locale} locale - Language the text is written in.
 * @returns {string} `text` with its first letter capitalized.
 */
function capitalizeFirstLetter(text: string, locale: Locale): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(FIRST_CHARACTER_COUNT);
}

/**
 * Returns a message from the dictionary exactly as written, with no capitalization applied.
 * @param {string} group - Dictionary section.
 * @param {string} key - Message name within the section.
 * @param {Locale} locale - Language of the returned message.
 * @returns {string} Translated message, in its original casing.
 */
export function getRawMessage<Group extends MessageGroupName, Key extends MessageKey<Group>>(
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
 * Returns a translated message from the dictionary. The result always starts with a capital
 * letter, so every dictionary entry can be written in lowercase and every call site (buttons,
 * links, headings, paragraphs, ...) gets sentence-style capitalization for free.
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
  return capitalizeFirstLetter(getRawMessage(group, key, locale), locale);
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
  const translate = ((key) => getMessage(group, key, locale)) as Translator<Group>;

  /**
   * @param {string} key - Message name within the group.
   * @returns {string} The message in its original casing.
   */
  translate.raw = (key) => getRawMessage(group, key, locale);

  return translate;
}
