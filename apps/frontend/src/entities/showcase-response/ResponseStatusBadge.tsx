"use client";

// Слой entities: бейдж статуса отклика
import { useTranslations } from "@/shared/i18n-context";
import { Badge } from "@/shared/ui/badge";

import type { ShowcaseResponseStatus } from "./index";

const STATUS_VARIANTS = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  CANCELLED: "muted",
  EXPIRED: "muted",
} as const;

const STATUS_LABEL_KEYS = {
  PENDING: "statusPending",
  ACCEPTED: "statusAccepted",
  REJECTED: "statusRejected",
  CANCELLED: "statusCancelled",
  EXPIRED: "statusExpired",
} as const;

/**
 * Пропсы {@link ResponseStatusBadge}.
 */
export interface ResponseStatusBadgeProps {
  /**
   * Статус отклика.
   */
  status: ShowcaseResponseStatus;
}

/**
 * Цветной бейдж статуса отклика с переводом.
 * @param {ResponseStatusBadgeProps} props - Статус для показа.
 * @returns {import('react').ReactNode} Бейдж.
 */
export function ResponseStatusBadge(props: ResponseStatusBadgeProps) {
  const t = useTranslations("showcaseResponses");

  return (
    <Badge variant={STATUS_VARIANTS[props.status]} className="uppercase">
      {t(STATUS_LABEL_KEYS[props.status])}
    </Badge>
  );
}
