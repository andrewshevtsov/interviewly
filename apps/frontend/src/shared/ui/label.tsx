import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Small uppercase field label (see "EMAIL", "ПАРОЛЬ" labels in the auth/profile forms).
 * @param {React.LabelHTMLAttributes<HTMLLabelElement>} props - Standard `label` props.
 * @returns {React.ReactNode} The label element.
 */
export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props;

  return (
    <label className={cn("block text-xs font-medium uppercase tracking-wide text-muted-foreground", className)} {...rest} />
  );
}
