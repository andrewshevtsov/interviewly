import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { FIELD_CLASSES } from "./input";

/**
 * Styled native `<select>` primitive, matching the `Input` component's field styling.
 * @param {React.SelectHTMLAttributes<HTMLSelectElement>} props - Standard `select` props.
 * @param {React.Ref<HTMLSelectElement>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactNode} The select element.
 */
function SelectImpl(props: React.SelectHTMLAttributes<HTMLSelectElement>, ref: React.Ref<HTMLSelectElement>) {
  const { className, ...rest } = props;

  return <select className={cn(FIELD_CLASSES, className)} ref={ref} {...rest} />;
}

export const Select = React.forwardRef(SelectImpl);

Select.displayName = "Select";
