// Слой views: страница подтверждения смены email по ссылке из письма.
// Разрешено импортировать widgets, features, entities, shared.
import { ConfirmEmail } from "@/features/confirm-email";
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { getServerTranslations } from "@/shared/i18n-server";

/**
 * Props for {@link ConfirmEmailPage}.
 */
export interface ConfirmEmailPageProps {
  /**
   * Токен из ссылки в письме.
   */
  token: string;
}

/**
 * Рендерит экран подтверждения по email: navbar, результат подтверждения и footer.
 * @param {ConfirmEmailPageProps} props - Токен из ссылки.
 * @returns {import('react').ReactNode} Страница подтверждения.
 */
export async function ConfirmEmailPage(props: ConfirmEmailPageProps) {
  const { token } = props;
  const t = await getServerTranslations("confirmEmail");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <ConfirmEmail token={token} />
      </main>

      <Footer />
    </div>
  );
}
