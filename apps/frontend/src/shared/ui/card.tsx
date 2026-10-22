import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Card container with a border, background and rounded corners (~12px, see `--radius`).
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard `div` props.
 * @returns {React.ReactNode} The card container.
 */
export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;

  return <div className={cn("rounded-lg border border-border bg-card text-card-foreground", className)} {...rest} />;
}

/**
 * Padded header region at the top of a {@link Card}.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard `div` props.
 * @returns {React.ReactNode} The card header.
 */
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;

  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...rest} />;
}

/**
 * Title text for a {@link Card}, rendered inside {@link CardHeader}.
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - Standard heading props.
 * @returns {React.ReactNode} The card title.
 */
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  const { className, ...rest } = props;

  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...rest} />;
}

/**
 * Secondary description text for a {@link Card}, rendered inside {@link CardHeader}.
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Standard paragraph props.
 * @returns {React.ReactNode} The card description.
 */
export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  const { className, ...rest } = props;

  return <p className={cn("text-sm text-muted-foreground", className)} {...rest} />;
}

/**
 * Main content region of a {@link Card}.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard `div` props.
 * @returns {React.ReactNode} The card content.
 */
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;

  return <div className={cn("p-6 pt-0", className)} {...rest} />;
}

/**
 * Footer region at the bottom of a {@link Card}.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard `div` props.
 * @returns {React.ReactNode} The card footer.
 */
export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;

  return <div className={cn("flex items-center p-6 pt-0", className)} {...rest} />;
}
