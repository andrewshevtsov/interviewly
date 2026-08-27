// Слой views: главный экран - приветствие и переход к списку сессий.
// Разрешено импортировать widgets, features, entities, shared.
import Link from "next/link";

/**
 * Renders the app's home screen with navigation to the sessions list.
 * @returns {import('react').ReactNode} The home page.
 */
export function HomePage() {
  return (
    <div>
      <h1>Interviewly</h1>
      <p>Сервис проведения технических и мок-интервью.</p>
      <Link href={"/sessions"}>Sessions</Link>
    </div>
  );
}
