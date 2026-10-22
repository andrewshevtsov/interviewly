import { redirect } from "next/navigation";

import { getRequestLocale } from "@/shared/i18n-server";

/**
 * Redirects the unlocalized root URL to the selected language.
 * @returns {Promise<never>} Redirect response.
 */
export default async function RootPage(): Promise<never> {
  redirect(`/${await getRequestLocale()}`);
}
