import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Пропсы {@link ComingSoon}.
 */
export interface ComingSoonProps {
  /**
   * Подпись поверх заблюренного содержимого, например "в разработке"
   */
  label: string;

  /**
   * Мок-содержимое будущей функциональности
   */
  children: React.ReactNode;

  /**
   * Дополнительные классы обёртки
   */
  className?: string;
}

/**
 * Размывает содержимое и подписывает его сверху
 * @param {ComingSoonProps} props - пропсы обёртки
 * @returns {React.ReactNode} Размытое содержимое с подписью
 */
export function ComingSoon(props: ComingSoonProps) {
  const { label, children, className } = props;

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none blur-sm" aria-hidden inert>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="whitespace-nowrap rounded-md border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase
            tracking-wide text-muted-foreground"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
