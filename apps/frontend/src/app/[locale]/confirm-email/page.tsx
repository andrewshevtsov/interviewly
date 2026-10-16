import { ConfirmEmailPage } from "@/views/confirm-email-page";

/**
 * Пропсы роута подтверждения email
 */
export interface ConfirmEmailRoutePageProps {
  /**
   * Query-параметры URL, разрешаются асинхронно
   */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Route "/confirm-email?token=..." - страница по ссылке из письма со сменой пароля.
 * @param {ConfirmEmailRoutePageProps} props - Пропсы роута Next.js с query-параметрами
 * @returns {Promise<import('react').ReactNode>} Страница подтверждения.
 */
export default async function Page(props: ConfirmEmailRoutePageProps) {
  const { token } = await props.searchParams;

  return <ConfirmEmailPage token={typeof token === "string" ? token : ""} />;
}
