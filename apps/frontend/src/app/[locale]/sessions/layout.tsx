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
 * Nested layout for everything under /sessions. No shared chrome here - each
 * page under this route brings its own navbar/footer (see @/views/sessions-list-page).
 * @param {SessionsLayoutProps} props - Props for the sessions layout.
 * @returns {ReactNode} The sessions layout.
 */
export default function SessionsLayout(props: SessionsLayoutProps) {
  return props.children;
}
