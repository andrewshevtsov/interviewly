import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm
  font-medium transition-colors focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
  disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline: "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props for {@link Button}.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Renders the child element instead of a `<button>`, forwarding props/classes onto it.
   */
  asChild?: boolean;

  /**
   * Состояние загрузки: кнопка заблокирована, перед текстом крутится спиннер.
   * С `asChild` спиннер не рисуется - Slot принимает ровно один дочерний элемент.
   */
  isLoading?: boolean;
}

/**
 * Styled button primitive (variants: default, secondary, outline, ghost, link, destructive).
 * @param {ButtonProps} props - Button props, including `variant`, `size`, `asChild` and `isLoading`.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactNode} The button element.
 */
function ButtonImpl(props: ButtonProps, ref: React.Ref<HTMLButtonElement>) {
  const { className, variant, size, asChild = false, isLoading = false, disabled, children, ...rest } = props;

  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const Button = React.forwardRef(ButtonImpl);

Button.displayName = "Button";

export { buttonVariants };
