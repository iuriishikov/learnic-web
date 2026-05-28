import * as React from "react"

import { cn } from "@/shared/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Convenience flag mapped to `aria-invalid` (drives the destructive ring). */
  invalid?: boolean
}

/**
 * Multi-line text field. Auto-grows with its content via CSS
 * `field-sizing: content` (clamp the range with `min-h-*` / `max-h-*`) and has
 * no manual resize handle. Pass `invalid` (or `aria-invalid`) for the
 * destructive state.
 */
function Textarea({
  className,
  invalid,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid ? true : ariaInvalid}
      className={cn(
        "flex field-sizing-content min-h-32 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs wrap-anywhere transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
