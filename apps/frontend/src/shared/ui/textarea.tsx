import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Styled multiline text input primitive (see the "О себе" field on the profile page).
 * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props - Standard `textarea` props.
 * @param {React.Ref<HTMLTextAreaElement>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactNode} The textarea element.
 */
function TextareaImpl(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  ref: React.Ref<HTMLTextAreaElement>,
) {
  const { className, ...rest } = props;

  return (
    <textarea
      className={cn(
        "flex min-h-[6rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
          "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...rest}
    />
  );
}

export const Textarea = React.forwardRef(TextareaImpl);

Textarea.displayName = "Textarea";
