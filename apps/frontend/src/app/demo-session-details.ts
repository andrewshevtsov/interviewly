// Мок-данные прошедших интервью (история и экран интервью). Не часть FSD - живут рядом
// с роутами, которые их используют.
//
// Mock data: id, участники, date и duration согласованы с сидом бэкенда
// (apps/backend/prisma/seed-data), чтобы отзыв, оставленный через форму, нашёлся по id сессии.
// Роли участников (интервьюер/кандидат) - статика, в БД у участника роли нет.
// Всё остальное (задача, код, подсказки, хронология, AI-резюме, метрики) тоже статика.
// История каждого пользователя - это сессии, где он есть в participants.
import type { PastSession } from "@/entities/session";

// Mock data: люди из сида бэкенда.
const OWNER = { email: "owner@interviewly.test", name: "Olivia Owner" };
const INTERVIEWER = { email: "interviewer@interviewly.test", name: "Ivan Interviewer" };
const CANDIDATE = { email: "candidate@interviewly.test", name: "Clara Candidate" };
const USER = { email: "user@interviewly.test", name: "Noah User" };

// Mock data
const PLACEHOLDER_SESSION: PastSession = {
  // Mock data: сид-сессия ...101 (business, запланирована на 10 сентября).
  id: "00000000-0000-4000-8000-000000000101",
  number: "4092",
  title: "System design: сервис нотификаций",
  date: "10 сентября 2026",
  duration: "62 мин",
  hintsUsed: 0,
  hintsTotal: 3,
  score: 9,
  scoreMax: 10,
  participants: [
    { ...INTERVIEWER, role: "interviewer", reconnects: 0 },
    { ...OWNER, role: "candidate", reconnects: 0 },
  ],
  taskTitle: "Спроектировать сервис уведомлений",
  taskDescription:
    "Нужно спроектировать сервис, который доставляет пользователям уведомления по нескольким каналам: " +
    "push, email и Telegram. Обсудить очередь сообщений, ретраи, идемпотентность и масштабирование.",
  topics: ["System design", "Очереди", "Идемпотентность"],
  codeLanguage: "TypeScript",
  finalCode: [
    "interface Notification {",
    "  id: string;",
    "  userId: string;",
    "  channel: \"push\" | \"email\" | \"telegram\";",
    "  payload: unknown;",
    "}",
    "",
    "async function deliver(notification: Notification) {",
    "  // Идемпотентность: повторную доставку с тем же id пропускаем",
    "  if (await alreadyDelivered(notification.id)) {",
    "    return;",
    "  }",
    "",
    "  await queue.publish(notification.channel, notification);",
    "}",
  ].join("\n"),
  hints: [],
  timeline: [
    { at: "00:00", text: "Сессия началась" },
    { at: "01:10", text: "Кандидат присоединился" },
    { at: "05:30", text: "Обсуждение требований и ожидаемой нагрузки" },
    { at: "24:15", text: "Выбрана очередь сообщений для доставки" },
    { at: "48:00", text: "Разбор ретраев и идемпотентности" },
    { at: "62:00", text: "Сессия завершена" },
  ],
  codeRuns: 0,
  strengths: ["Чётко разделил приём и доставку уведомлений", "Сразу учёл идемпотентность"],
  growthAreas: ["Не оценил стоимость хранения истории уведомлений"],
};

export const DEMO_PAST_SESSIONS: PastSession[] = [
  PLACEHOLDER_SESSION,
  {
    // Mock data: сид-сессия ...105 (completed mock, Ivan Interviewer + Clara Candidate).
    id: "00000000-0000-4000-8000-000000000105",
    number: "4033",
    title: "React: лишние перерисовки",
    date: "28 августа 2026",
    duration: "47 мин",
    hintsUsed: 2,
    hintsTotal: 3,
    score: 7,
    scoreMax: 10,
    participants: [
      { ...INTERVIEWER, role: "interviewer", reconnects: 0 },
      { ...CANDIDATE, role: "candidate", reconnects: 1 },
    ],
    taskTitle: "Убрать лишние перерисовки в списке",
    taskDescription:
      "Компонент списка перерисовывается целиком при каждом вводе в поле поиска. " +
      "Найти причину и предложить исправление с помощью мемоизации.",
    topics: ["React", "Хуки", "Мемоизация"],
    codeLanguage: "TypeScript",
    finalCode: [
      "const Row = memo(function Row({ item, onSelect }: RowProps) {",
      "  return <li onClick={() => onSelect(item.id)}>{item.title}</li>;",
      "});",
      "",
      "function List({ items }: { items: Item[] }) {",
      "  const onSelect = useCallback((id: string) => select(id), []);",
      "",
      "  return (",
      "    <ul>",
      "      {items.map((item) => <Row key={item.id} item={item} onSelect={onSelect} />)}",
      "    </ul>",
      "  );",
      "}",
    ].join("\n"),
    hints: [
      { at: "14:05", text: "Проверьте, меняются ли ссылки на функции-обработчики между рендерами." },
      { at: "26:30", text: "memo сравнивает пропсы по ссылке - что произойдёт с колбэком, созданным прямо в теле компонента?" },
    ],
    timeline: [
      { at: "00:00", text: "Сессия началась" },
      { at: "01:00", text: "Кандидат присоединился" },
      { at: "09:30", text: "Проблема воспроизведена через React DevTools Profiler" },
      { at: "14:05", text: "Запрошена первая AI-подсказка" },
      { at: "22:10", text: "Компонент строки обёрнут в memo" },
      { at: "26:30", text: "Запрошена вторая AI-подсказка" },
      { at: "33:00", text: "Колбэк стабилизирован через useCallback" },
      { at: "47:00", text: "Сессия завершена" },
    ],
    codeRuns: 5,
    strengths: ["Уверенно пользуется Profiler для поиска причин"],
    growthAreas: [
      "Сначала обернула компонент в memo, не проверив причину",
      "Не упомянула альтернативу: вынести колбэк за пределы компонента",
    ],
  },
  {
    // Mock data: сид-сессия ...104 (completed mock, Olivia Owner + Noah User).
    id: "00000000-0000-4000-8000-000000000104",
    number: "4071",
    title: "SQL и индексы",
    date: "25 августа 2026",
    duration: "41 мин",
    hintsUsed: 3,
    hintsTotal: 3,
    score: 6,
    scoreMax: 10,
    participants: [
      { ...OWNER, role: "interviewer", reconnects: 0 },
      { ...USER, role: "candidate", reconnects: 1 },
    ],
    taskTitle: "Ускорить медленный запрос",
    taskDescription:
      "Запрос последних заказов пользователя выполняется несколько секунд на большой таблице. " +
      "Найти узкое место и предложить индекс, который ускорит фильтр и сортировку.",
    topics: ["SQL", "Индексы", "EXPLAIN"],
    codeLanguage: "SQL",
    finalCode: [
      "CREATE INDEX idx_orders_user_created",
      "  ON orders (user_id, created_at DESC);",
      "",
      "SELECT id, total",
      "FROM orders",
      "WHERE user_id = $1",
      "ORDER BY created_at DESC",
      "LIMIT 20;",
    ].join("\n"),
    hints: [
      { at: "08:20", text: "Посмотрите план запроса через EXPLAIN ANALYZE - где выполняется полный проход по таблице?" },
      { at: "17:45", text: "Подумайте, какой порядок колонок в составном индексе подойдёт и под фильтр, и под сортировку." },
      { at: "29:10", text: "Индекс по (user_id, created_at DESC) позволит обойтись без отдельной сортировки." },
    ],
    timeline: [
      { at: "00:00", text: "Сессия началась" },
      { at: "01:00", text: "Кандидат присоединился" },
      { at: "08:20", text: "Запрошена первая AI-подсказка" },
      { at: "12:30", text: "Первый запуск запроса" },
      { at: "17:45", text: "Запрошена вторая AI-подсказка" },
      { at: "29:10", text: "Запрошена третья AI-подсказка" },
      { at: "35:00", text: "Индекс создан, запрос ускорился" },
      { at: "41:00", text: "Сессия завершена" },
    ],
    codeRuns: 4,
    strengths: ["Быстро нашёл узкое место через EXPLAIN"],
    growthAreas: [
      "Не сразу связал порядок колонок в индексе с сортировкой",
      "Не проверил влияние индекса на скорость записи",
    ],
  },
  {
    // Mock data: сид-сессия ...103 (completed mock, Olivia Owner + Clara Candidate).
    id: "00000000-0000-4000-8000-000000000103",
    number: "3980",
    title: "Алгоритмы: связные списки",
    date: "20 августа 2026",
    duration: "55 мин",
    hintsUsed: 1,
    hintsTotal: 3,
    score: 8,
    scoreMax: 10,
    participants: [
      { ...OWNER, role: "interviewer", reconnects: 0 },
      { ...CANDIDATE, role: "candidate", reconnects: 2 },
    ],
    taskTitle: "Развернуть связный список",
    taskDescription:
      "Реализовать функцию, которая разворачивает односвязный список на месте. " +
      "Оценить сложность решения по времени и по памяти.",
    topics: ["Алгоритмы", "Связные списки", "Big-O"],
    codeLanguage: "Python",
    finalCode: [
      "def reverse_list(head):",
      "    prev, curr = None, head",
      "    while curr:",
      "        next_temp = curr.next",
      "        curr.next = prev",
      "        prev = curr",
      "        curr = next_temp",
      "    return prev",
    ].join("\n"),
    hints: [{ at: "12:40", text: "Подумайте, какие указатели нужно сохранить, прежде чем перенаправить next." }],
    timeline: [
      { at: "00:00", text: "Сессия началась" },
      { at: "01:00", text: "Кандидат присоединился" },
      { at: "12:40", text: "Запрошена AI-подсказка" },
      { at: "20:15", text: "Первый запуск кода" },
      { at: "31:00", text: "Потеряно соединение, через 20 секунд восстановлено" },
      { at: "44:30", text: "Решение принято, обсуждение сложности" },
      { at: "55:00", text: "Сессия завершена" },
    ],
    codeRuns: 3,
    strengths: ["Чистый код, проговаривала ход мыслей"],
    growthAreas: ["Не рассмотрела пустой список", "Оценка сложности по памяти прозвучала не сразу"],
  },
];

// Mock data: источник значений заблюреных блоков экрана интервью и истории
export const DEMO_SESSION_PLACEHOLDER = PLACEHOLDER_SESSION;
