// Слой views: страница входа/регистрации.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { AuthCard } from "@/widgets/auth-card";

/**
 * Renders the auth screen: navbar, a centered login/registration card and the footer.
 * @returns {import('react').ReactNode} The auth page.
 */
export function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <AuthCard />
      </main>

      <Footer />
    </div>
  );
}
