import type { ReactNode } from "react";

import { getServerTranslations } from "@/shared/i18n-server";
import { LocalizedLink } from "@/shared/ui/localized-link";

/**
 * Props for {@link SessionsLayout}.
 */
export interface SessionsLayoutProps {
  /**
   * Nested route content: the sessions list (/sessions) or a single
   * session's detail page (/sessions/[sessionId]).
   */
  children: ReactNode;
}

/**
 * Nested layout for everything under /sessions. Wraps the root layout
 * (app/layout.tsx) and adds chrome shared only by the sessions section.
 * @param {SessionsLayoutProps} props - Props for the sessions layout.
 * @returns {ReactNode} The sessions layout.
 */
export default async function SessionsLayout(props: SessionsLayoutProps) {
  const t = await getServerTranslations("session");

  return (
    <section>
      <nav>
        <LocalizedLink href="/">Interviewly</LocalizedLink>
      </nav>
      <h2>{t("sessionsTitle")}</h2>
      {props.children}
    </section>
  );
}
