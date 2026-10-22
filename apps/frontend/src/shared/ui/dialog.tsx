"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Props for {@link DialogContent}.
 */
export interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /**
   * Accessible label of the close (X) button, already translated.
   */
  closeLabel: string;
}

/**
 * Modal window with a dimmed backdrop and a close button. Focus is trapped inside and `Esc`
 * closes it (Radix Dialog behaviour).
 * @param {DialogContentProps} props - Content props, including the translated `closeLabel`.
 * @returns {React.ReactNode} The dialog content in a portal.
 */
export function DialogContent(props: DialogContentProps) {
  const { className, children, closeLabel, ...rest } = props;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          `fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`,
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          `fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2
          -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg
          data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0`,
          className,
        )}
        {...rest}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100
            focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/**
 * Dialog heading block (title + description).
 * @param {React.ComponentProps<"div">} props - Standard `div` props.
 * @returns {React.ReactNode} The header container.
 */
export function DialogHeader(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;

  return <div className={cn("flex flex-col gap-1.5 pr-6", className)} {...rest} />;
}

/**
 * Row of dialog action buttons.
 * @param {React.ComponentProps<"div">} props - Standard `div` props.
 * @returns {React.ReactNode} The footer container.
 */
export function DialogFooter(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;

  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...rest} />;
}

/**
 * Accessible dialog title (required by Radix for screen readers).
 * @param {React.ComponentProps<typeof DialogPrimitive.Title>} props - Title props.
 * @returns {React.ReactNode} The title element.
 */
export function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const { className, ...rest } = props;

  return <DialogPrimitive.Title className={cn("text-lg font-semibold leading-tight", className)} {...rest} />;
}

/**
 * Accessible dialog description.
 * @param {React.ComponentProps<typeof DialogPrimitive.Description>} props - Description props.
 * @returns {React.ReactNode} The description element.
 */
export function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const { className, ...rest } = props;

  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...rest} />;
}
