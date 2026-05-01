import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Textarea } from "@/shared/ui/textarea"

/**
 * Multi-line input that grows with its content via CSS `field-sizing: content`
 * (inherited from the base `Textarea`) and disables the manual resize handle.
 * Use `min-h-*` / `max-h-*` to clamp the auto-grow range.
 */
function TextareaAutosize({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="textarea-autosize"
      className={cn("resize-none", className)}
      {...props}
    />
  )
}

export { TextareaAutosize }
