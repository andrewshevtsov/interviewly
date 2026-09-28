// Слой views: страница входа/регистрации.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { AuthCard } from "@/widgets/auth-card";

/**
 * Пропсы {@link AuthPage}
 */
export interface AuthPageProps {
  /**
   * Куда вернуть пользователя после входа
   */
  returnPath?: string;
}

/**
 * Renders the auth screen: navbar, a centered login/registration card and the footer.
 * @param {AuthPageProps} props - Пропсы страницы
 * @returns {import('react').ReactNode} The auth page.
 */
export function AuthPage(props: AuthPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <AuthCard returnPath={props.returnPath} />
      </main>

      <Footer />
    </div>
  );
}
