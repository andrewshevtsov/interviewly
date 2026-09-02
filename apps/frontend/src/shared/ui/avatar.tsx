import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/shared/lib/cn";

/**
 * Circular avatar container (see participant circles in the showcase cards).
 * @param {AvatarPrimitive.AvatarProps} props - Radix `Avatar.Root` props.
 * @returns {React.ReactNode} The avatar container.
 */
export function Avatar(props: AvatarPrimitive.AvatarProps) {
  const { className, ...rest } = props;

  return (
    <AvatarPrimitive.Root
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...rest}
    />
  );
}

/**
 * Image rendered inside an {@link Avatar}, falling back to {@link AvatarFallback} on error.
 * @param {AvatarPrimitive.AvatarImageProps} props - Radix `Avatar.Image` props.
 * @returns {React.ReactNode} The avatar image.
 */
export function AvatarImage(props: AvatarPrimitive.AvatarImageProps) {
  const { className, ...rest } = props;

  return <AvatarPrimitive.Image className={cn("aspect-square h-full w-full", className)} {...rest} />;
}

/**
 * Fallback content (e.g. initials) shown while an {@link AvatarImage} is loading or missing.
 * @param {AvatarPrimitive.AvatarFallbackProps} props - Radix `Avatar.Fallback` props.
 * @returns {React.ReactNode} The avatar fallback.
 */
export function AvatarFallback(props: AvatarPrimitive.AvatarFallbackProps) {
  const { className, ...rest } = props;

  return (
    <AvatarPrimitive.Fallback
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted font-medium", className)}
      {...rest}
    />
  );
}
