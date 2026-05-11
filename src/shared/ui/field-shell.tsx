"use client"

import * as React from "react"
import { CircleHelpIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field"
import { RequiredMark } from "@/shared/ui/required-mark"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

export type FieldShellProps = {
  id?: string
  label: React.ReactNode
  required?: boolean
  helpTooltip?: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function FieldShell({
  id,
  label,
  required,
  helpTooltip,
  hint,
  disabled,
  className,
  children,
}: FieldShellProps) {
  return (
    <Field
      data-disabled={disabled ? "true" : undefined}
      className={cn("gap-1.5", className)}
    >
      <div className="flex items-center gap-1 group-data-[disabled=true]/field:opacity-50">
        <FieldLabel htmlFor={id} className="text-sm font-medium leading-none">
          <span>{label}</span>
          {required && <RequiredMark />}
        </FieldLabel>
        {helpTooltip && (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  "inline-flex shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
                  "[&_svg]:size-3.5"
                )}
                aria-label="More info"
              >
                <CircleHelpIcon />
              </TooltipTrigger>
              <TooltipContent>{helpTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {hint && (
        <FieldDescription className="text-xs leading-relaxed">
          {hint}
        </FieldDescription>
      )}
    </Field>
  )
}
