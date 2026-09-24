/** Языки, которые поддерживает приложение. */
export const SUPPORTED_LOCALES = ["ru", "en"] as const;

/** Язык, поддерживаемый приложением. */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Язык, который используется, если запрошенный недоступен. */
export const DEFAULT_LOCALE: Locale = "ru";

/** Кука, в которой сохраняется выбранный язык. */
export const LOCALE_COOKIE_NAME = "locale";

/** Заголовок запроса, заполняемый из сегмента URL с локалью. */
export const REQUEST_LOCALE_HEADER_NAME = "x-interviewly-locale";

const LOCALE_PATH_SEGMENT_INDEX = 1;
const FIRST_CHARACTER_COUNT = 1;

/** Переводы одного сообщения на все поддерживаемые языки. */
export type Translation = Record<Locale, string>;

/** Именованная группа переведённых сообщений. */
export type MessageGroup = Record<string, Translation>;

/** Полный словарь приложения. */
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
    chooseLanguage: { ru: "выбрать язык", en: "choose language" },
    signIn: { ru: "войти", en: "sign in" },
    logout: { ru: "выйти", en: "log out" },
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
    firstName: { ru: "имя", en: "first name" },
    firstNamePlaceholder: { ru: "Артём", en: "John" },
    lastName: { ru: "фамилия", en: "last name" },
    lastNamePlaceholder: { ru: "Соколов", en: "Doe" },
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
    loginPending: { ru: "входим...", en: "signing in..." },
    loginError: {
      ru: "неверный email или пароль",
      en: "invalid email or password",
    },
    registerPending: { ru: "создаём аккаунт...", en: "creating account..." },
    registerError: {
      ru: "не удалось зарегистрироваться. проверьте данные",
      en: "couldn't sign up. check your details",
    },
    telegramLoginError: {
      ru: "не удалось войти через Telegram. попробуйте ещё раз",
      en: "couldn't sign in with Telegram. try again",
    },
    passwordMismatch: { ru: "пароли не совпадают", en: "passwords don't match" },
  },
  hero: {
    titleStart: { ru: "Проведи", en: "Run a" },
    titleAccent: { ru: "техническое", en: "technical" },
    titleEnd: { ru: "интервью.", en: "interview." },
    description: {
      ru:
        "Живой кодинг, камера, AI-подсказки и честная обратная связь. " +
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
    savePending: { ru: "сохраняем...", en: "saving..." },
    saveError: {
      ru: "не удалось сохранить профиль. попробуйте ещё раз",
      en: "couldn't save the profile. try again",
    },
    saveSuccess: { ru: "изменения сохранены", en: "changes saved" },
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
    copyInviteLink: { ru: "скопировать ссылку", en: "copy invite link" },
    inviteLinkCopied: { ru: "ссылка скопирована", en: "link copied" },
    connecting: { ru: "Подключаемся к комнате…", en: "Connecting to the room…" },
    connectionError: {
      ru: "Не удалось подключиться к комнате. Обновите страницу.",
      en: "Couldn't connect to the room. Reload the page.",
    },
    mediaUnavailable: {
      ru: "Нет доступа к камере или микрофону — проверьте разрешения браузера. Вы в комнате без них.",
      en: "No access to the camera or microphone — check the browser permissions. You're in the room without them.",
    },
    waitingForParticipants: { ru: "Ждём второго участника…", en: "Waiting for the other participant…" },
    accessRequestsTitle: { ru: "заявки на вход", en: "access requests" },
    approveRequest: { ru: "принять", en: "approve" },
    rejectRequest: { ru: "отклонить", en: "reject" },
    transferOwnershipTitle: { ru: "сделать владельцем", en: "make owner" },
    transferOwnershipHint: {
      ru: "Передать можно только другому интервьюеру.",
      en: "Ownership can only go to another interviewer.",
    },
    transferOwnership: { ru: "сделать владельцем", en: "make owner" },
    transferOwnershipError: {
      ru: "Не удалось передать владение, попробуйте ещё раз.",
      en: "Couldn't transfer ownership, try again.",
    },
    reviewRequestError: {
      ru: "Не удалось обработать заявку, попробуйте ещё раз.",
      en: "Couldn't process the request, try again.",
    },
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
    telegramNotice: {
      ru: "Всем приглашённым Telegram-бот пришлёт уведомление о запуске сессии.",
      en: "The Telegram bot will notify every invitee when the session starts.",
    },
    launchSession: { ru: "запустить сессию", en: "launch session" },
    launchingSession: { ru: "Создаём сессию…", en: "Creating the session…" },
    passwordTooShort: {
      ru: "Пароль должен быть не короче 4 символов.",
      en: "The password must be at least 4 characters long.",
    },
    createError: {
      ru: "Не удалось создать сессию, попробуйте ещё раз.",
      en: "Couldn't create the session, try again.",
    },
  },
  feedback: {
    title: { ru: "обратная связь", en: "feedback" },
    scoreLabel: { ru: "оценка", en: "score" },
    completedNotice: {
      ru: "завершена. Отзыв виден только вам.",
      en: "is complete. Feedback is visible only to you.",
    },
    targetLabel: { ru: "участник, о котором отзыв", en: "who is this feedback about" },
    targetPlaceholder: { ru: "выберите участника…", en: "choose a participant…" },
    targetLoading: { ru: "загружаем участников…", en: "loading participants…" },
    targetLoadError: {
      ru: "не удалось загрузить список участников",
      en: "couldn't load the participant list",
    },
    commentLabel: { ru: "комментарий", en: "comment" },
    commentPlaceholder: {
      ru: "Чистый код, проговаривал ход мыслей, стоит подтянуть крайние случаи...",
      en: "Clean code, talked through the thought process, could work on edge cases...",
    },
    saving: { ru: "Сохраняем…", en: "Saving…" },
    saveResult: { ru: "сохранить результат", en: "save result" },
    saveError: { ru: "не удалось сохранить отзыв", en: "couldn't save the feedback" },
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
    sessionClosed: {
      ru: "Эта сессия уже завершена.",
      en: "This session has already ended.",
    },
    requestAccessTitle: { ru: "Вход в сессию", en: "Join the session" },
    requestAccessDescription: {
      ru: "Владелец сессии увидит вашу заявку и впустит вас в комнату.",
      en: "The session owner will see your request and let you into the room.",
    },
    passwordLabel: { ru: "пароль сессии", en: "session password" },
    requestAccess: { ru: "подать заявку", en: "request access" },
    sendingRequest: { ru: "Отправляем…", en: "Sending…" },
    waitingForApproval: {
      ru: "Заявка отправлена. Ждём, пока владелец сессии вас впустит…",
      en: "Request sent. Waiting for the session owner to let you in…",
    },
    requestRejected: {
      ru: "Владелец сессии отклонил заявку. Можно отправить её ещё раз.",
      en: "The session owner rejected your request. You can send it again.",
    },
    wrongPassword: { ru: "Неверный пароль.", en: "Wrong password." },
    inviteOnly: {
      ru: "Сессия только по приглашению — попросите владельца сессии добавить вас.",
      en: "This session is invite-only — ask the session owner to add you.",
    },
    requestError: {
      ru: "Не удалось отправить заявку, попробуйте ещё раз.",
      en: "Couldn't send the request, try again.",
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

/** Раздел словаря верхнего уровня. */
export type MessageGroupName = keyof typeof messages;

/** Допустимое имя сообщения из выбранной группы словаря. */
export type MessageKey<Group extends MessageGroupName> = keyof (typeof messages)[Group];

/** Переводчик, ограниченный одной группой словаря. */
export interface Translator<Group extends MessageGroupName> {
  <Key extends MessageKey<Group>>(key: Key): string;

  /**
   * Возвращает сообщение в том виде, как оно записано в словаре, без автоматической заглавной
   * буквы, которую ставит обычный вызов. Только для значений, где важен точный регистр (например,
   * пример email) или которые продолжают предложение, начатое другой переведённой строкой.
   */
  raw<Key extends MessageKey<Group>>(key: Key): string;
}

/**
 * Проверяет, что значение - один из поддерживаемых языков.
 * @param {unknown} value - Проверяемое значение.
 * @returns {boolean} Является ли значение поддерживаемой локалью.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.some((locale) => locale === value);
}

/**
 * Возвращает поддерживаемый язык или язык по умолчанию.
 * @param {unknown} value - Предполагаемая локаль.
 * @returns {Locale} Допустимая локаль приложения.
 */
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Добавляет выбранный язык в начало внутреннего URL приложения.
 * @param {string} href - Внутренний URL или фрагмент страницы.
 * @param {Locale} locale - Язык, который нужно добавить в URL.
 * @returns {string} URL с учётом локали.
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
 * Делает первую букву строки заглавной, остальное не трогает. Учитывает локаль, поэтому
 * работает правильно для всех поддерживаемых языков, а не только для ASCII.
 * @param {string} text - Текст, первую букву которого нужно сделать заглавной.
 * @param {Locale} locale - Язык текста.
 * @returns {string} `text` с заглавной первой буквой.
 */
function capitalizeFirstLetter(text: string, locale: Locale): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(FIRST_CHARACTER_COUNT);
}

/**
 * Возвращает сообщение из словаря ровно в том виде, как оно записано, без заглавной буквы.
 * @param {string} group - Раздел словаря.
 * @param {string} key - Имя сообщения внутри раздела.
 * @param {Locale} locale - Язык возвращаемого сообщения.
 * @returns {string} Переведённое сообщение в исходном регистре.
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
 * Возвращает переведённое сообщение из словаря. Результат всегда начинается с заглавной буквы,
 * поэтому все записи словаря можно писать строчными, а в каждом месте вызова (кнопки, ссылки,
 * заголовки, абзацы, ...) регистр как в предложении получается сам.
 * @param {string} group - Раздел словаря.
 * @param {string} key - Имя сообщения внутри раздела.
 * @param {Locale} locale - Язык возвращаемого сообщения.
 * @returns {string} Переведённое сообщение.
 */
export function getMessage<Group extends MessageGroupName, Key extends MessageKey<Group>>(
  group: Group,
  key: Key,
  locale: Locale,
): string {
  return capitalizeFirstLetter(getRawMessage(group, key, locale), locale);
}

/**
 * Создаёт переводчик, привязанный к языку и группе словаря.
 * @param {string} group - Раздел словаря.
 * @param {Locale} locale - Язык возвращаемых сообщений.
 * @returns {Translator} Переводчик для выбранной группы.
 */
export function createTranslator<Group extends MessageGroupName>(
  group: Group,
  locale: Locale,
): Translator<Group> {
  const translate = ((key) => getMessage(group, key, locale)) as Translator<Group>;

  /**
   * @param {string} key - Имя сообщения внутри группы.
   * @returns {string} Сообщение в исходном регистре.
   */
  translate.raw = (key) => getRawMessage(group, key, locale);

  return translate;
}
