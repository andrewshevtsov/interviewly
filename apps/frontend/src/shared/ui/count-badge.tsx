import { cn } from "@/shared/lib/cn";

const MAX_SHOWN_COUNT = 99;

/**
 * Пропсы {@link CountBadge}.
 */
export interface CountBadgeProps {
  /**
   * Число уведомлений/событий
   */
  count: number;

  /**
   * Дополнительные классы.
   */
  className?: string;
}

/**
 * Бейдж уведомлений.
 * @param {CountBadgeProps} props - Число и классы.
 * @returns {import('react').ReactNode} Бейдж.
 */
export function CountBadge(props: CountBadgeProps) {
  const { count, className } = props;

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        `inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold
        leading-none text-primary-foreground`,
        className,
      )}
      role="status"
    >
      {count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : count}
    </span>
  );
}
