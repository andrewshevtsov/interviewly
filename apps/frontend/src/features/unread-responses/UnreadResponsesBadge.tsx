"use client";

// Слой features: круглый бейдж с числом непрочитанных сообщений в чатах по откликам.
import { CountBadge } from "@/shared/ui/count-badge";
import { useUnreadMessages, type UnreadMessages } from "@/entities/showcase-response";

/**
 * Пропсы {@link UnreadResponsesBadge}.
 */
export interface UnreadResponsesBadgeProps {
  /**
   * Считать только входящие или только исходящие отклики; без значения - все.
   */
  box?: UnreadMessages["box"];

  /**
   * Дополнительные классы значка.
   */
  className?: string;
}

/**
 * Значок «непрочитанные» для кнопки или вкладки откликов; пока непрочитанных нет, ничего не рисует.
 * @param {UnreadResponsesBadgeProps} props - Сторона и классы.
 * @returns {import('react').ReactNode} Бейдж с числом или `null`.
 */
export function UnreadResponsesBadge(props: UnreadResponsesBadgeProps) {
  const { box, className } = props;
  const unread = useUnreadMessages();

  return <CountBadge count={unread.total(box)} className={className} />;
}
