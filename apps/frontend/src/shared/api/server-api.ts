// Слой shared: GET-запросы к backend из серверных компонентов Next.js. Внутри Docker сервер
// фронта ходит к backend по имени сервиса (BACKEND_INTERNAL_URL), браузер - по NEXT_PUBLIC_API_URL
const API_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Запрашивает JSON у backend с сервера и кеширует ответ на `revalidateSeconds`
 * @param {string} path - Путь API, например "/leaderboard?limit=20"
 * @param {number} revalidateSeconds - Сколько секунд ответ живёт в кеше данных Next.js
 * @returns {Promise<T>} Тело ответа
 */
export async function fetchFromServer<T>(path: string, revalidateSeconds: number): Promise<T> {
  if (!API_URL) {
    throw new Error("Backend URL is not set: define BACKEND_INTERNAL_URL or NEXT_PUBLIC_API_URL");
  }

  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
