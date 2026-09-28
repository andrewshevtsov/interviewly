import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Маленькая заглавная подпись-заголовок секции внутри карточки.
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - стандартные пропсы заголовка.
 * @returns {React.ReactNode} Подпись секции.
 */
export function SectionLabel(props: React.HTMLAttributes<HTMLHeadingElement>) {
  const { className, ...rest } = props;

  return (
    <h2
      className={cn("text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
      {...rest}
    />
  );
}
