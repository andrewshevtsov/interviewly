import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Styled text input primitive matching the button/card visual language.
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - Standard `input` props.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactNode} The input element.
 */
function InputImpl(props: React.InputHTMLAttributes<HTMLInputElement>, ref: React.Ref<HTMLInputElement>) {
  const { className, ...rest } = props;

  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
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

export const Input = React.forwardRef(InputImpl);

Input.displayName = "Input";
