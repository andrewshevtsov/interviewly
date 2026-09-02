import type { ReactNode } from "react";

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
export default function SessionsLayout(props: SessionsLayoutProps) {
  return (
    <section>
      <h2>Sessions</h2>
      {props.children}
    </section>
  );
}
