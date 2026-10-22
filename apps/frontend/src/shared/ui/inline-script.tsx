// Слой shared: синхронный inline-скрипт (например, для установки темы до первой отрисовки).
// type переключается на "text/plain" на клиенте, чтобы React не предупреждал о <script>
// внутри рендера и не пересоздавал/не выполнял его повторно при гидратации.
/**
 * Props for {@link InlineScript}.
 */
export interface InlineScriptProps {
  /**
   * Raw JavaScript source executed synchronously while the browser parses the HTML.
   */
  html: string;
}

/**
 * Renders a synchronous inline `<script>` that runs before hydration (e.g. to prevent
 * a theme flash). See Next.js guide "Preventing flash before hydration".
 * @param {InlineScriptProps} props - The script props.
 * @returns {import('react').ReactNode} The script element.
 */
export function InlineScript(props: InlineScriptProps) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}
