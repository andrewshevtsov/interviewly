import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Styled checkbox primitive (native `<input type="checkbox">`, tinted via `accent-color`).
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - Standard `input` props.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactNode} The checkbox element.
 */
function CheckboxImpl(
  props: React.InputHTMLAttributes<HTMLInputElement>,
  ref: React.Ref<HTMLInputElement>,
) {
  const { className, ...rest } = props;

  return (
    <input
      type="checkbox"
      className={cn(
        `h-5 w-5 shrink-0 cursor-pointer rounded border border-input bg-background accent-primary
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50`,
        className,
      )}
      ref={ref}
      {...rest}
    />
  );
}

export const Checkbox = React.forwardRef(CheckboxImpl);

Checkbox.displayName = "Checkbox";
