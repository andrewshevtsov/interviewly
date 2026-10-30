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
    difficultyEasy: { ru: "легкий", en: "easy" },
    difficultyMedium: { ru: "средний", en: "medium" },
    difficultyHard: { ru: "сложный", en: "hard" },
  },
  metadata: {
    description: {
      ru: "Сервис проведения технических и мок-интервью",
      en: "A platform for technical and mock interviews",
    },
  },
  navigation: {
    showcase: { ru: "витрина", en: "showcase" },
    taskBank: { ru: "банк задач", en: "task bank" },
    leaderboard: { ru: "лидерборд", en: "leaderboard" },
    history: { ru: "история", en: "history" },
    profile: { ru: "кабинет", en: "profile" },
    chooseLanguage: { ru: "выбрать язык", en: "choose language" },
    signIn: { ru: "войти", en: "sign in" },
    logout: { ru: "выйти", en: "log out" },
    createSession: { ru: "создать сессию", en: "create session" },
  },
  taskBank: {
    title: { ru: "банк задач", en: "task bank" },
    createTask: { ru: "добавить задачу", en: "create new task" },
    editTask: { ru: "редактировать", en: "edit task" },
    editTitle: { ru: "редактирование задачи", en: "edit task" },
    editDescription: {
      ru: "Измените данные задачи или выбранного языкового варианта. После сохранения эталонное решение будет проверено снова.",
      en: "Update the task or selected language variant. The reference solution will be verified again after saving.",
    },
    backToTasks: { ru: "к банку задач", en: "back to task bank" },
    unsavedChangesTitle: {
      ru: "есть несохранённые изменения",
      en: "you have unsaved changes",
    },
    unsavedChangesDescription: {
      ru: "Если уйти со страницы сейчас, изменения в задаче и языковых вариантах будут потеряны.",
      en: "If you leave this page now, changes to the task and its language variants will be lost.",
    },
    stayOnPage: { ru: "остаться", en: "stay on page" },
    leaveWithoutSaving: { ru: "уйти без сохранения", en: "leave without saving" },
    stack: { ru: "стек", en: "stack" },
    statusNotImplemented: { ru: "не реализован", en: "not implemented" },
    saveAndVerify: { ru: "сохранить и проверить", en: "save and verify" },
    editSuccess: {
      ru: "Изменения сохранены, вариант успешно прошёл проверку.",
      en: "Changes saved and the variant passed verification.",
    },
    editError: {
      ru: "Не удалось сохранить изменения. Попробуйте ещё раз.",
      en: "Couldn't save the changes. Try again.",
    },
    editConflict: {
      ru: "Задачу уже изменил другой администратор. Обновите страницу перед повторным сохранением.",
      en: "Another administrator has already changed this task. Refresh the page before saving again.",
    },
    editLoadError: {
      ru: "Не удалось загрузить задачу для редактирования.",
      en: "Couldn't load the task for editing.",
    },
    editAccessDenied: {
      ru: "Редактировать задачи могут только администраторы.",
      en: "Only administrators can edit tasks.",
    },
    noTaskVariants: {
      ru: "У задачи нет языковых вариантов для редактирования.",
      en: "This task has no language variants to edit.",
    },
    statusDraft: { ru: "черновик", en: "draft" },
    statusVerifying: { ru: "проверяется", en: "verifying" },
    statusVerified: { ru: "проверен", en: "verified" },
    statusFailed: { ru: "ошибка", en: "failed" },
    createTitle: { ru: "новая задача", en: "new task" },
    createDescription: {
      ru: "Сначала опишите задачу, затем добавьте одну или несколько языковых реализаций.",
      en: "Describe the task first, then add one or more language implementations.",
    },
    creationProgress: { ru: "этапы создания задачи", en: "task creation steps" },
    editingProgress: { ru: "этапы редактирования задачи", en: "task editing steps" },
    detailsStep: { ru: "1. задача", en: "1. task details" },
    implementationStep: { ru: "2. реализация", en: "2. implementation" },
    next: { ru: "далее", en: "next" },
    back: { ru: "назад", en: "back" },
    save: { ru: "сохранить", en: "save" },
    saving: { ru: "сохраняем...", en: "saving..." },
    detailsSaved: {
      ru: "Основные данные задачи сохранены.",
      en: "Task details saved.",
    },
    deleteTask: { ru: "удалить задачу", en: "delete task" },
    deleteTaskTitle: { ru: "удалить задачу?", en: "delete task?" },
    deleteTaskDescription: {
      ru:
        "Задача пропадёт из банка задач и больше не будет доступна для создания " +
        "новых сессий. Уже созданные сессии сохранят снимок задачи.",
      en:
        "The task will disappear from the task bank and won't be available for new " +
        "sessions anymore. Existing sessions will retain their task snapshot.",
    },
    deleteTaskCancel: { ru: "не удалять", en: "keep task" },
    deletingTask: { ru: "удаляем...", en: "deleting..." },
    deleteTaskError: {
      ru: "Не удалось удалить задачу. Попробуйте ещё раз.",
      en: "Couldn't delete the task. Try again.",
    },
    close: { ru: "закрыть", en: "close" },
    name: { ru: "название", en: "title" },
    namePlaceholder: {
      ru: "Сумма элементов массива",
      en: "Sum of array elements",
    },
    taskDescription: { ru: "описание", en: "description" },
    descriptionPlaceholder: {
      ru: "Напишите функцию, которая принимает массив чисел и возвращает сумму всех его элементов.",
      en: "Write a function that accepts an array of numbers and returns the sum of all its elements.",
    },
    difficultyPlaceholder: {
      ru: "Выберите уровень сложности",
      en: "Select a difficulty level",
    },
    selectDifficulty: {
      ru: "Выберите уровень сложности.",
      en: "Select a difficulty level.",
    },
    language: { ru: "язык", en: "language" },
    languagePlaceholder: {
      ru: "Выберите язык первой реализации",
      en: "Select the language for the first implementation",
    },
    selectLanguage: { ru: "Выберите язык.", en: "Select a language." },
    selectStackPlaceholder: { ru: "Выберите стек", en: "Select a stack" },
    startingCode: { ru: "стартовый код", en: "starting code" },
    startingCodeHint: {
      ru: "Заготовка, которую кандидат увидит в редакторе и дополнит своим решением.",
      en: "The initial code candidates see in the editor and complete with their solution.",
    },
    startingCodePlaceholder: {
      ru: "function solve(numbers) {\n  // Напишите решение здесь\n}",
      en: "function solve(numbers) {\n  // Write your solution here\n}",
    },
    harness: { ru: "харнесс", en: "harness" },
    harnessHint: {
      ru: "Служебный код, который получает входные данные, запускает решение пользователя и возвращает результат для проверки.",
      en: "Runner code that reads the input, invokes the user's solution, and returns its result for validation.",
    },
    harnessPlaceholder: {
      ru: "const result = solve(input.numbers);\nprocess.stdout.write(JSON.stringify(result));",
      en: "const result = solve(input.numbers);\nprocess.stdout.write(JSON.stringify(result));",
    },
    harnessLoadError: {
      ru: "Не удалось загрузить стандартный Harness. Выберите язык ещё раз.",
      en: "Couldn't load the default harness. Select the language again.",
    },
    testCases: { ru: "тест-кейсы", en: "test cases" },
    testCasesHint: {
      ru: "Скрытые проверки: кандидат их не увидит. Результат решения будет сравниваться с ожидаемым значением каждого кейса.",
      en: "Hidden checks candidates cannot see. Their solution output is compared with the expected result for each case.",
    },
    testCase: { ru: "входные данные", en: "input" },
    addTestCase: { ru: "добавить тест-кейс", en: "add test case" },
    removeTestCase: { ru: "удалить тест-кейс", en: "remove test case" },
    testCaseInputPlaceholder: {
      ru: "[1, 2, 3, 4]",
      en: "[1, 2, 3, 4]",
    },
    expectedOutput: { ru: "ожидаемый результат", en: "expected output" },
    expectedOutputPlaceholder: { ru: "10", en: "10" },
    sampleCode: { ru: "эталонное решение", en: "sample code" },
    sampleCodeHint: {
      ru:
        "Полное правильное решение задачи. Оно запускается для каждого тест-кейса и " +
        "подтверждает, что входные данные дают указанный ожидаемый результат. " +
        "Кандидату этот код никогда не показывается.",
      en:
        "A complete correct solution. It runs against every test case to confirm that each " +
        "input produces the specified expected output. Candidates never see this code.",
    },
    sampleCodePlaceholder: {
      ru: "function solve(numbers) {\n  return numbers.reduce((sum, value) => sum + value, 0);\n}",
      en: "function solve(numbers) {\n  return numbers.reduce((sum, value) => sum + value, 0);\n}",
    },
    createSubmit: { ru: "создать задачу", en: "create task" },
    finishCreation: { ru: "завершить", en: "finish" },
    languageVariantSaved: {
      ru: "Вариант проверен и сохранён. Выберите следующий язык.",
      en: "The variant was verified and saved. Select the next language.",
    },
    verifying: {
      ru: "проверяем решение...",
      en: "verifying solution...",
    },
    testCaseName: { ru: "Тест-кейс", en: "Test case" },
    invalidTestCaseJson: {
      ru: "Входные данные и ожидаемые результаты должны быть корректным JSON.",
      en: "Test inputs and expected outputs must be valid JSON.",
    },
    verificationFailed: {
      ru: "Эталонное решение не прошло проверку.",
      en: "The reference solution failed verification.",
    },
    createError: {
      ru: "Не удалось создать задачу. Попробуйте ещё раз.",
      en: "Couldn't create the task. Try again.",
    },
    accessDenied: {
      ru: "Добавлять задачи могут только администраторы.",
      en: "Only administrators can create tasks.",
    },
    description: {
      ru: "Выберите задачу для подготовки к техническому интервью.",
      en: "Choose a problem to prepare for a technical interview.",
    },
    difficulty: { ru: "сложность", en: "difficulty" },
    allLanguages: { ru: "все языки", en: "all languages" },
    allDifficulties: { ru: "любая сложность", en: "any difficulty" },
    python: { ru: "Python", en: "Python" },
    javascript: { ru: "JavaScript", en: "JavaScript" },
    typescript: { ru: "TypeScript", en: "TypeScript" },
    taskCount: { ru: "задач найдено", en: "Tasks found" },
    loading: { ru: "Загрузка...", en: "Loading..." },
    showDescription: { ru: "показать условие", en: "show description" },
    hideDescription: { ru: "скрыть условие", en: "hide description" },
    empty: {
      ru: "Задач с такими параметрами пока нет.",
      en: "There are no problems matching these filters yet.",
    },
    loadError: {
      ru: "Не удалось загрузить задачи. Попробуйте обновить страницу.",
      en: "Couldn't load the problems. Try refreshing the page.",
    },
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
    rememberMe: { ru: "запомнить меня", en: "remember me" },
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
    searchLabel: { ru: "поиск", en: "search" },
    searchPlaceholder: { ru: "Имя, роль или стек...", en: "Name, role or stack..." },
    foundCount: { ru: "найдено карточек", en: "profiles found" },
    shownCount: { ru: "показано карточек", en: "profiles shown" },
    myResponses: { ru: "мои отклики", en: "my responses" },
    loadMore: { ru: "показать ещё", en: "show more" },
    loadingMore: { ru: "загружаем...", en: "loading..." },
    empty: {
      ru: "Никого не нашли. Измените фильтры или загляните позже.",
      en: "Nobody found. Change the filters or check back later.",
    },
    loadError: {
      ru: "Не удалось загрузить витрину. Попробуйте ещё раз.",
      en: "Couldn't load the showcase. Please try again.",
    },
    retry: { ru: "повторить", en: "retry" },
    interviewsConducted: { ru: "интервью", en: "interviews" },
    telegramHintTitle: { ru: "Telegram не привязан", en: "Telegram is not linked" },
    telegramHintText: {
      ru:
        "Пока уведомления об откликах и ссылка на встречу приходят на почту. " +
        "Привяжите Telegram, и бот напишет вам в мессенджере.",
      en:
        "For now response notifications and the meeting link go to your email. " +
        "Link Telegram and the bot will message you there.",
    },
  },
  showcaseResponses: {
    pageTitle: { ru: "отклики", en: "responses" },
    pageDescription: {
      ru: "Входящие отклики на вашу карточку и ваши отклики на чужие.",
      en: "Responses to your card and your responses to other cards.",
    },
    backToShowcase: { ru: "к витрине", en: "to the showcase" },
    tabIncoming: { ru: "входящие", en: "incoming" },
    tabOutgoing: { ru: "исходящие", en: "outgoing" },
    loadError: {
      ru: "Не удалось загрузить отклики. Попробуйте ещё раз.",
      en: "Couldn't load the responses. Please try again.",
    },
    retry: { ru: "повторить", en: "retry" },
    close: { ru: "закрыть", en: "close" },
    statusPending: { ru: "ждёт решения", en: "pending" },
    statusAccepted: { ru: "принят", en: "accepted" },
    statusRejected: { ru: "отклонён", en: "rejected" },
    statusCancelled: { ru: "отозван", en: "cancelled" },
    statusExpired: { ru: "просрочен", en: "expired" },
    roleInterviewer: { ru: "интервьюер", en: "interviewer" },
    roleCandidate: { ru: "кандидат", en: "candidate" },
    meetingAt: { ru: "время встречи", en: "meeting time" },

    respondTitle: { ru: "Откликнуться на карточку", en: "Respond to this card" },
    respondDescription: {
      ru: "Выберите свою роль и время. Владелец карточки решит, подходит ли ему такая встреча.",
      en: "Pick your role and a time. The card owner will decide whether the meeting suits them.",
    },
    yourRole: { ru: "ваша роль", en: "your role" },
    roleInterviewerHint: { ru: "Вы проводите интервью", en: "You conduct the interview" },
    roleCandidateHint: { ru: "Вас интервьюируют", en: "You are interviewed" },
    dateTimeLabel: { ru: "время встречи", en: "meeting time" },
    dateTimeHint: {
      ru: "Не раньше чем через 3 часа и не позже чем через 30 дней, по вашему местному времени.",
      en: "At least 3 hours and at most 30 days from now, in your local time.",
    },
    send: { ru: "отправить отклик", en: "send response" },
    sending: { ru: "отправляем...", en: "sending..." },
    respondSuccess: {
      ru: "Отклик отправлен. Владелец карточки решит, подходит ли ему встреча, и вы получите уведомление.",
      en: "Response sent. The card owner will decide whether the meeting suits them and you will be notified.",
    },
    reminderNote: {
      ru: "За 2 часа до начала бот пришлёт ссылку на видеокомнату:",
      en: "The bot will send the video room link 2 hours before it starts:",
    },
    errInvalidTime: {
      ru: "Проверьте время: оно должно быть от 3 часов до 30 дней от текущего момента.",
      en: "Check the time: it must be between 3 hours and 30 days from now.",
    },
    errOwnCard: {
      ru: "Нельзя откликнуться на свою карточку.",
      en: "You can't respond to your own card.",
    },
    errCardGone: {
      ru: "Эта карточка больше недоступна на витрине.",
      en: "This card is no longer available on the showcase.",
    },
    errNoProfile: {
      ru: "Чтобы откликаться, заполните свой профиль.",
      en: "To respond, fill in your profile first.",
    },
    fillProfile: { ru: "открыть профиль", en: "open profile" },
    errAlreadyPending: {
      ru: "Вы уже откликались на эту карточку: дождитесь решения или отзовите отклик.",
      en: "You have already responded to this card: wait for a decision or withdraw the response.",
    },
    errMeetingScheduled: {
      ru: "С этим участником уже назначена встреча. Чтобы откликнуться снова, сначала отмените её.",
      en: "You already have a meeting scheduled with this participant. Cancel it first to respond again.",
    },
    errCooldown: {
      ru: "Предыдущий отклик отклонён. Откликнуться снова можно после",
      en: "Your previous response was rejected. You can respond again after",
    },
    errOwnerBusy: {
      ru: "Владелец карточки занят в это время. Предложите другое время.",
      en: "The card owner is busy at that time. Propose another time.",
    },
    errYouBusy: {
      ru: "У вас уже есть встреча или другой отклик на это время. Предложите другое время.",
      en: "You already have a meeting or another response at that time. Propose another time.",
    },
    errGeneric: {
      ru: "Не удалось отправить отклик. Попробуйте ещё раз.",
      en: "Couldn't send the response. Please try again.",
    },

    incomingEmpty: {
      ru: "Пока никто не откликнулся на вашу карточку. Включите показ карточки на витрине в профиле.",
      en: "Nobody has responded to your card yet. Turn on showing your card on the showcase in your profile.",
    },
    pendingHeading: { ru: "ждут вашего решения", en: "waiting for your decision" },
    reviewedHeading: { ru: "решённые", en: "decided" },
    wantsToBe: { ru: "хочет быть", en: "wants to be" },
    youWillBe: { ru: "вы будете", en: "you will be" },
    accept: { ru: "принять", en: "accept" },
    accepting: { ru: "принимаем...", en: "accepting..." },
    reject: { ru: "отклонить", en: "reject" },
    acceptedNote: {
      ru: "Встреча назначена. За 2 часа до начала бот пришлёт обоим ссылку на комнату.",
      en: "The meeting is set. The bot will send both of you the room link 2 hours before it starts.",
    },
    openSession: { ru: "открыть комнату", en: "open the room" },
    rejectTitle: { ru: "Отклонить отклик", en: "Reject the response" },
    rejectDescription: {
      ru: "Объясните причину: откликнувшийся её увидит.",
      en: "Explain the reason: the responder will see it.",
    },
    reasonLabel: { ru: "причина отказа", en: "reason" },
    reasonHint: {
      ru: "От 30 до 500 символов.",
      en: "Between 30 and 500 characters.",
    },
    timeMismatchLabel: { ru: "Неудобное время", en: "Inconvenient time" },
    sendRejection: { ru: "отклонить отклик", en: "reject response" },
    rejecting: { ru: "отклоняем...", en: "rejecting..." },
    rejectedReason: { ru: "причина отказа", en: "reason" },
    revAlreadyReviewed: {
      ru: "Этот отклик уже обработан. Обновите список.",
      en: "This response has already been handled. Refresh the list.",
    },
    revTimePassed: {
      ru: "Время встречи уже прошло. Отклик больше нельзя принять.",
      en: "The meeting time has already passed. This response can't be accepted anymore.",
    },
    revYouBusy: {
      ru: "У вас уже есть встреча в это время. Отклоните отклик и отметьте, что дело во времени.",
      en: "You already have a meeting at that time. Reject the response and mark that it is about the time.",
    },
    revResponderBusy: {
      ru: "Откликнувшийся уже занят в это время. Отклоните отклик и отметьте, что дело во времени.",
      en: "The responder is already busy at that time. Reject the response and mark that it is about the time.",
    },
    revNotAllowed: { ru: "Это действие вам недоступно.", en: "You can't do this." },
    revGeneric: {
      ru: "Не удалось выполнить действие. Попробуйте ещё раз.",
      en: "Couldn't complete the action. Please try again.",
    },

    outgoingEmpty: {
      ru: "Вы ещё ни на кого не откликались. Найдите партнёра на витрине.",
      en: "You haven't responded to anyone yet. Find a partner on the showcase.",
    },
    toCard: { ru: "карточка", en: "card" },
    myRole: { ru: "ваша роль", en: "your role" },
    cancelResponse: { ru: "отозвать отклик", en: "withdraw response" },
    cancelling: { ru: "отзываем...", en: "withdrawing..." },
    canRetryAfter: { ru: "Откликнуться снова можно после", en: "You can respond again after" },
    canRetryNow: {
      ru: "Отказ из-за времени: можно сразу предложить другое время.",
      en: "Declined because of the time: you can propose another time right away.",
    },
    goToShowcase: { ru: "к витрине", en: "to the showcase" },
    cardWaiting: { ru: "ожидаем ответ", en: "awaiting reply" },
    cardMeetingScheduled: { ru: "встреча назначена", en: "meeting scheduled" },
    cardRetryAfter: { ru: "повторный отклик:", en: "respond again:" },
    meetingCancelled: { ru: "Встреча отменена", en: "Meeting cancelled" },
    cancelMeeting: { ru: "отменить встречу", en: "cancel the meeting" },
    cancelMeetingTitle: { ru: "Отменить встречу?", en: "Cancel the meeting?" },
    cancelMeetingText: {
      ru: "Второй участник получит уведомление, время освободится. Вернуть встречу нельзя: нужно договариваться заново.",
      en: "The other participant is notified and the time is freed. This can't be undone: you would need to agree again.",
    },
    cancelMeetingConfirm: { ru: "отменить встречу", en: "cancel the meeting" },
    cancelMeetingPending: { ru: "отменяем...", en: "cancelling..." },
    cancelMeetingKeep: { ru: "оставить", en: "keep it" },
    cancelMeetingError: {
      ru: "Не удалось отменить: встреча уже началась или закончилась.",
      en: "Couldn't cancel: the meeting has already started or ended.",
    },
    chat: { ru: "чат", en: "chat" },
    chatTitle: { ru: "Чат по отклику", en: "Response chat" },
    chatDescription: {
      ru: "Обсудите детали встречи. Сообщения обновляются раз в 10 секунд, уведомления о них не приходят.",
      en: "Discuss the details of the meeting. Messages refresh every 10 seconds; you are not notified about them.",
    },
    chatEmpty: { ru: "Сообщений пока нет. Напишите первым.", en: "No messages yet. Write first." },
    chatPlaceholder: { ru: "Ваше сообщение", en: "Your message" },
    chatSend: { ru: "отправить", en: "send" },
    chatSending: { ru: "отправляем...", en: "sending..." },
    chatLoadError: { ru: "Не удалось загрузить сообщения.", en: "Couldn't load the messages." },
    chatSendError: { ru: "Не удалось отправить сообщение.", en: "Couldn't send the message." },
    chatYou: { ru: "вы", en: "you" },
    chatPartner: { ru: "собеседник", en: "partner" },
  },
  livePreview: {
    title: { ru: "видеосессии", en: "video sessions" },
    description: {
      ru: "Создавайте комнаты и участвуйте в видео-интервью.",
      en: "Create rooms and join video interviews.",
    },
    details: {
      ru: "Решайте задачи в совместном редакторе. Запускайте код для проверки и отладки.",
      en: "Solve tasks in a shared editor. Run code to test and debug it.",
    },
  },
  leaderboard: {
    title: { ru: "лидерборд", en: "leaderboard" },
    description: {
      ru: "Топ участников по количеству пройденных интервью",
      en: "Top participants by number of completed interviews",
    },
    sessions: { ru: "сессий", en: "sessions" },
    participantColumn: { ru: "участник", en: "participant" },
    interviewsColumn: { ru: "интервью", en: "interviews" },
    empty: {
      ru: "Пока никто не завершил ни одного интервью - станьте первым.",
      en: "Nobody has finished an interview yet - be the first.",
    },
    loadError: {
      ru: "Не удалось загрузить лидерборд. Попробуйте обновить страницу позже.",
      en: "Couldn't load the leaderboard. Please refresh the page later.",
    },
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
    showcaseVisible: {
      ru: "показывать мою карточку на витрине",
      en: "show my card on the showcase",
    },
    showcaseVisibleHint: {
      ru: "Другие участники смогут откликнуться на вашу карточку. Нужны заполненная роль и хотя бы одна технология.",
      en: "Other participants will be able to respond to your card. A role and at least one technology are required.",
    },
    saveErrorShowcase: {
      ru: "чтобы показываться на витрине, заполните роль и выберите хотя бы одну технологию",
      en: "to appear on the showcase, fill in your role and pick at least one technology",
    },
  },
  account: {
    title: { ru: "аккаунт", en: "account" },
    description: {
      ru: "Имя, почта и Telegram, по которым вас находят и которым мы пишем.",
      en: "The name, email and Telegram we use to reach you.",
    },
    firstName: { ru: "имя", en: "first name" },
    lastName: { ru: "фамилия", en: "last name" },
    telegramUsername: { ru: "ник в Telegram", en: "telegram username" },
    telegramPlaceholder: { ru: "ваш_ник", en: "your_username" },
    telegramHint: {
      ru: "Только для отображения. Сменили ник в Telegram - обновите его и здесь. Уведомления идут по привязанному аккаунту.",
      en: "Display only. If you changed your Telegram username, update it here too. Notifications go to the linked account.",
    },
    save: { ru: "сохранить", en: "save" },
    saving: { ru: "сохраняем...", en: "saving..." },
    saved: { ru: "изменения сохранены", en: "changes saved" },
    saveError: {
      ru: "не удалось сохранить. попробуйте ещё раз",
      en: "couldn't save. try again",
    },
    saveErrorTelegram: {
      ru: "ник в Telegram: 5-32 символа, латиница, цифры и _",
      en: "telegram username: 5-32 characters, latin letters, digits and _",
    },
    emailTitle: { ru: "email", en: "email" },
    emailDescription: {
      ru: "Адрес меняется только после подтверждения: мы отправим письмо со ссылкой на новый адрес.",
      en: "The address changes only after confirmation: we send a link to the new address.",
    },
    emailCurrent: { ru: "текущий email", en: "current email" },
    emailNone: { ru: "не указан", en: "not set" },
    emailNoneHint: {
      ru: "Вы вошли через Telegram. Добавьте почту, чтобы получать уведомления и на неё.",
      en: "You signed in through Telegram. Add an email to get notifications there too.",
    },
    changeEmail: { ru: "сменить email", en: "change email" },
    addEmail: { ru: "добавить email", en: "add email" },
    closeForm: { ru: "отмена", en: "cancel" },
    newEmail: { ru: "новый email", en: "new email" },
    newEmailPlaceholder: { ru: "you@company.dev", en: "you@company.dev" },
    currentPassword: { ru: "текущий пароль", en: "current password" },
    sendConfirmation: { ru: "отправить письмо", en: "send confirmation" },
    sendingConfirmation: { ru: "отправляем...", en: "sending..." },
    pendingTitle: { ru: "ждём подтверждения", en: "waiting for confirmation" },
    pendingPrefix: { ru: "Письмо со ссылкой отправлено на", en: "We sent a confirmation link to" },
    pendingUntil: { ru: "Ссылка действует до", en: "The link is valid until" },
    pendingHint: {
      ru: "Чтобы отправить письмо ещё раз или на другой адрес, нажмите «сменить email».",
      en: "To resend the email or use another address, press the change email button.",
    },
    cancelChange: { ru: "отменить смену", en: "cancel change" },
    errWrongPassword: { ru: "неверный пароль", en: "wrong password" },
    errEmailTaken: {
      ru: "этот адрес уже используется другим аккаунтом",
      en: "this address is already used by another account",
    },
    errEmailInvalid: {
      ru: "проверьте адрес: он должен быть настоящим и отличаться от текущего",
      en: "check the address: it must be valid and different from the current one",
    },
    errMailFailed: {
      ru: "не удалось отправить письмо. попробуйте позже",
      en: "couldn't send the email. try again later",
    },
    errGeneric: {
      ru: "что-то пошло не так. попробуйте ещё раз",
      en: "something went wrong. try again",
    },
  },
  confirmEmail: {
    title: { ru: "подтверждение email", en: "email confirmation" },
    pending: { ru: "подтверждаем адрес...", en: "confirming your address..." },
    success: { ru: "email подтверждён", en: "email confirmed" },
    successText: { ru: "К аккаунту привязан адрес", en: "Your account now uses the address" },
    toProfile: { ru: "в личный кабинет", en: "go to profile" },
    noToken: {
      ru: "в ссылке нет токена. Откройте ссылку из письма целиком",
      en: "the link has no token. Open the full link from the email",
    },
    errInvalid: {
      ru: "ссылка недействительна или устарела. Запросите смену email в личном кабинете ещё раз",
      en: "the link is invalid or has expired. Request the email change in your profile again",
    },
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
    linked: { ru: "Telegram привязан", en: "Telegram linked" },
    unlink: { ru: "отвязать", en: "unlink" },
    errTaken: {
      ru: "Этот Telegram уже привязан к другому аккаунту.",
      en: "This Telegram account is already linked to another user.",
    },
    errNeedEmail: {
      ru: "Сначала добавьте почту: иначе вы потеряете вход в аккаунт.",
      en: "Add an email first, otherwise you would lose access to your account.",
    },
    errGeneric: {
      ru: "Не получилось. Попробуйте ещё раз.",
      en: "Something went wrong. Try again.",
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
    testProgress: { ru: "выполнено тестов", en: "tests completed" },
    testStatuspassed: { ru: "пройден", en: "passed" },
    testStatusfailed: { ru: "не пройден", en: "failed" },
    testStatuserror: { ru: "ошибка запуска", en: "execution error" },
    testInput: { ru: "входные данные", en: "input" },
    testExpected: { ru: "ожидалось", en: "expected" },
    testActual: { ru: "получено", en: "actual" },
    interviewerVideo: { ru: "видео интервьюера", en: "interviewer video" },
    candidateVideo: { ru: "видео кандидата", en: "candidate video" },
    interviewer: { ru: "интервьюер", en: "interviewer" },
    you: { ru: "вы", en: "you" },
    aiHint: { ru: "AI-подсказка", en: "AI hint" },
    aiHintsTitle: { ru: "AI-подсказки", en: "AI hints" },
    nextDemoTask: { ru: "новая задача", en: "next task" },
    demoTaskCounter: { ru: "задача", en: "task" },
    demoTaskEmpty: {
      ru: "Задача ещё не выбрана: интервьюер показывает её кнопкой «новая задача».",
      en: "No task yet: the interviewer shows one with the “next task” button.",
    },
    demoTaskError: { ru: "Не удалось сменить задачу", en: "Couldn't switch the task" },
    openEditor: { ru: "Открыть редактор", en: "Open editor" },
    closeEditor: { ru: "Закрыть редактор", en: "Close editor" },
    toggleEditorError: { ru: "Не удалось переключить редактор", en: "Couldn't toggle the editor" },
    aiHintsEmpty: { ru: "Подсказок пока не было.", en: "No hints yet." },
    aiHintPending: { ru: "Генерируем подсказку…", en: "Generating a hint…" },
    aiHintWaitActive: {
      ru: "Подсказки станут доступны, после того как присоединится второй участник",
      en: "Hints become available once both participants are in the room",
    },
    aiHintLimitError: {
      ru: "Подсказки закончились",
      en: "No hints left for this session",
    },
    aiHintUnavailableError: {
      ru: "AI-сервис недоступен, попробуйте ещё раз.",
      en: "The AI service is unavailable, try again.",
    },
    aiHintError: {
      ru: "Не удалось получить подсказку, попробуйте ещё раз.",
      en: "Couldn't get a hint, try again.",
    },
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
    historyEmpty: {
      ru: "У вас пока нет прошедших интервью.",
      en: "You have no past interviews yet.",
    },
    historyLoadError: {
      ru: "Не удалось загрузить историю интервью",
      en: "Couldn't load your interview history",
    },
    typeBusiness: { ru: "Бизнес-интервью", en: "Business interview" },
    typeMock: { ru: "Мок-интервью", en: "Mock interview" },
    minutesShort: { ru: "мин", en: "min" },
    comingSoon: { ru: "в разработке", en: "coming soon" },
    hintsUsedLabel: { ru: "подсказок", en: "hints used" },
    scoreOutOf: { ru: "из", en: "out of" },
    endSession: { ru: "завершить", en: "end session" },
    endingSession: { ru: "завершаем…", en: "ending…" },
    endSessionError: { ru: "не удалось завершить", en: "couldn't end session" },
    leaveSession: { ru: "выйти", en: "leave" },
    sessionEnded: { ru: "интервью завершено", en: "The interview has ended" },
    redirectingToFeedback: { ru: "переходим к отзыву…", en: "taking you to the feedback…" },
    participantsSuffix: { ru: "участника", en: "participants" },
    // Подписи локальной консоли запуска кода в совместном редакторе.
    outputLabel: { ru: "вывод", en: "output" },
    codeRunBy: { ru: "Код запущен пользователем", en: "Code run by" },
    dateLabel: { ru: "дата", en: "date" },
    timeLabel: { ru: "время", en: "time" },
    resizeOutput: { ru: "Изменить высоту области вывода", en: "Resize output area" },
    emptyOutput: { ru: "Программа ничего не вывела", en: "The program produced no output" },
    syntaxHint: {
      ru: "Подсветка синтаксиса и автокомплит включены.",
      en: "Syntax highlighting and autocomplete are enabled.",
    },
    running: { ru: "Выполняется…", en: "Running…" },
    runCode: { ru: "запустить код", en: "run code" },
    runCodeError: { ru: "Не удалось запустить код", en: "Couldn't run the code" },
    copyInviteLink: { ru: "скопировать ссылку", en: "copy invite link" },
    inviteLinkCopied: { ru: "ссылка скопирована", en: "link copied" },
    connecting: { ru: "Подключаемся к комнате…", en: "Connecting to the room…" },
    connectionError: {
      ru: "Не удалось подключиться к комнате. Обновите страницу.",
      en: "Couldn't connect to the room. Reload the page.",
    },
    reconnecting: { ru: "Связь потеряна, переподключаемся…", en: "Connection lost, reconnecting…" },
    mediaUnavailable: {
      ru: "Нет доступа к камере или микрофону — проверьте разрешения браузера. Вы в комнате без них.",
      en: "No access to the camera or microphone — check the browser permissions. You're in the room without them.",
    },
    waitingForParticipants: {
      ru: "Ждём второго участника…",
      en: "Waiting for the other participant…",
    },
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
    sessionTitlePlaceholder: {
      ru: "Техническое интервью",
      en: "Technical interview",
    },
    taskLabel: { ru: "условие задачи", en: "task" },
    taskPlaceholder: {
      ru: "Разверните связный список на месте…",
      en: "Reverse a linked list in place…",
    },
    taskHint: {
      ru: "Условие видит AI, когда кандидат просит подсказку.",
      en: "The AI sees the task when the candidate asks for a hint.",
    },
    languageLabel: { ru: "язык программирования", en: "programming language" },
    languageSelectPlaceholder: {
      ru: "выберите язык…",
      en: "choose a language…",
    },
    languagePython: { ru: "Python", en: "Python" },
    languageJavaScript: { ru: "JavaScript", en: "JavaScript" },
    languageTypeScript: { ru: "TypeScript", en: "TypeScript" },
    bankTaskLabel: { ru: "задача из банка", en: "task from the library" },
    taskSelectPlaceholder: { ru: "выберите задачу…", en: "choose a task…" },
    tasksLoading: { ru: "загружаем задачи…", en: "loading tasks…" },
    tasksLoadError: {
      ru: "не удалось загрузить задачи для выбранного языка",
      en: "couldn't load tasks for the selected language",
    },
    customTask: { ru: "Своя задача", en: "Custom task" },
    customTaskHint: {
      ru: "Вместо задачи из банка укажите собственное условие.",
      en: "Provide your own prompt instead of using a task from the library.",
    },
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
    noComment: { ru: "без комментария", en: "no comment" },
  },
  summary: {
    backToHistory: { ru: "назад", en: "back" },
    notCompleted: { ru: "Интервью ещё не завершено", en: "The interview hasn't ended yet" },
    loadError: { ru: "Не удалось загрузить интервью", en: "Couldn't load the interview" },
    participantsTitle: { ru: "участники", en: "participants" },
    you: { ru: "вы", en: "you" },
    metricsTitle: { ru: "метрики", en: "metrics" },
    hintsUsed: { ru: "использовано подсказок", en: "hints used" },
    codeRuns: { ru: "запусков кода", en: "code runs" },
    reconnects: { ru: "переподключений", en: "reconnects" },
    feedbackTitle: { ru: "ваш отзыв о партнёре", en: "your feedback about your partner" },
    feedbackPrivate: { ru: "отзыв виден только вам.", en: "only you can see this feedback." },
    feedbackEmpty: {
      ru: "вы пока не оставили отзыв об этом интервью.",
      en: "you haven't left any feedback about this interview yet.",
    },
    feedbackLoadError: { ru: "не удалось загрузить отзыв.", en: "couldn't load your feedback." },
    feedbackWritten: { ru: "написан", en: "written on" },
    leaveFeedback: { ru: "оставить отзыв", en: "leave feedback" },
    taskTitle: { ru: "условие задачи", en: "task" },
    codeTitle: { ru: "итоговый код", en: "final code" },
    hintsTitle: { ru: "AI-подсказки", en: "AI hints" },
    hintsEmpty: { ru: "подсказки не использовались.", en: "no hints were used." },
    timelineTitle: { ru: "хронология", en: "timeline" },
    aiSummaryTitle: { ru: "AI-резюме", en: "AI summary" },
    strengthsTitle: { ru: "что получилось хорошо", en: "what went well" },
    growthAreasTitle: { ru: "зоны роста", en: "areas to grow" },
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
