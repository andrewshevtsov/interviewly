import { CircleHelp } from "lucide-react";

import { Label } from "@/shared/ui/label";

interface FieldLabelWithTooltipProps {
  /** Идентификатор связанного поля. */
  htmlFor?: string;
  /** Видимое название поля. */
  label: string;
  /** Текст всплывающей подсказки. */
  hint: string;
}

/** Единый лейбл поля с подсказкой, доступной по hover и keyboard focus. */
export function FieldLabelWithTooltip(props: FieldLabelWithTooltipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      <span className="group relative inline-flex" tabIndex={0} aria-label={props.hint}>
        <CircleHelp className="size-4 cursor-help text-muted-foreground" aria-hidden />
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-72
            -translate-x-1/2 rounded-md border bg-popover p-3 text-xs font-normal normal-case
            tracking-normal text-popover-foreground shadow-md group-hover:block group-focus:block`}
        >
          {props.hint}
        </span>
      </span>
    </div>
  );
}
