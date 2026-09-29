import { AuthPage } from "@/views/auth-page";
import { RETURN_PATH_PARAM, resolveReturnPath } from "@/shared/lib/return-path";

/**
 * Пропсы локализованного роута входа/регистрации
 */
export interface AuthRoutePageProps {
  /**
   * Query-параметры URL, разрешаются асинхронно
   */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Localized login/registration route.
 * @param {AuthRoutePageProps} props - Пропсы роута Next.js с query-параметрами
 * @returns {Promise<import('react').ReactNode>} The auth page.
 */
export default async function Page(props: AuthRoutePageProps) {
  const searchParams = await props.searchParams;

  return <AuthPage returnPath={resolveReturnPath(searchParams[RETURN_PATH_PARAM])} />;
}
