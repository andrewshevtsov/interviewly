import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold " +
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        muted: "border-border bg-muted text-muted-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/**
 * Props for {@link Badge}.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Small status/tag pill (variants: default, secondary, muted, success, warning, destructive,
 * outline) — used for participant status ("СВОБОДЕН"/"НА СЕССИИ"), stack tags and rating badges.
 * @param {BadgeProps} props - Badge props, including `variant`.
 * @returns {React.ReactNode} The badge element.
 */
export function Badge(props: BadgeProps) {
  const { className, variant, ...rest } = props;

  return <span className={cn(badgeVariants({ variant }), className)} {...rest} />;
}

export { badgeVariants };
