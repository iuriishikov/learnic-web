"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { motion } from "motion/react"

import { cn } from "@/shared/lib/utils"

type SwitchSize = "sm" | "default"

type SwitchExtraProps = {
  size?: SwitchSize
  /**
   * Force the focus-visible styling without an actual focus. Demo-only.
   */
  previewFocused?: boolean
}

function Switch({
  className,
  size = "default",
  previewFocused,
  ...props
}: SwitchPrimitive.Root.Props & SwitchExtraProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-preview-focused={previewFocused ? "true" : undefined}
      className={cn(
        // Layout
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full",
        "select-none outline-none",
        // Smooth color + ring transitions
        "transition-[background-color,box-shadow,border-color] duration-250 ease-out",
        // Extended tap area
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        // Track sizes
        "data-[size=default]:h-5 data-[size=default]:w-9",
        "data-[size=sm]:h-4 data-[size=sm]:w-7",
        // Off / on backgrounds
        "data-checked:bg-brand",
        "data-unchecked:bg-input/80 dark:data-unchecked:bg-input/60",
        // Hover (off state only)
        "hover:data-unchecked:bg-input",
        // Focus-visible: branded halo on `on`, branded inset outline on `off`
        "focus-visible:data-checked:ring-[3px] focus-visible:data-checked:ring-brand/35",
        "focus-visible:data-unchecked:bg-background focus-visible:data-unchecked:ring-[2px] focus-visible:data-unchecked:ring-inset focus-visible:data-unchecked:ring-brand",
        // Mirror of focus-visible for demo-driven preview state
        "data-[preview-focused=true]:data-checked:ring-[3px] data-[preview-focused=true]:data-checked:ring-brand/35",
        "data-[preview-focused=true]:data-unchecked:bg-background data-[preview-focused=true]:data-unchecked:ring-[2px] data-[preview-focused=true]:data-unchecked:ring-inset data-[preview-focused=true]:data-unchecked:ring-brand",
        // Invalid
        "aria-invalid:ring-[3px] aria-invalid:ring-destructive/30",
        // Disabled — fade everything, keep brand readable
        "data-disabled:cursor-not-allowed data-disabled:opacity-55",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Thumb base
          "pointer-events-none block rounded-full bg-background",
          "shadow-[0_1.5px_4px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04]",
          "dark:bg-foreground dark:ring-black/20 dark:data-checked:bg-background",
          // Thumb sizes
          "group-data-[size=default]/switch:size-4",
          "group-data-[size=sm]/switch:size-3",
          // Spring slide — overshoot curve
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          // Off / on translation
          "data-unchecked:translate-x-[2px]",
          "data-checked:translate-x-[calc(100%+2px)]",
          // Press-feedback squish (driven by parent active state)
          "group-active/switch:scale-90",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

type SwitchFieldProps = SwitchPrimitive.Root.Props &
  SwitchExtraProps & {
    label: React.ReactNode
    description?: React.ReactNode
    /** Vertical alignment of the switch relative to the text block. */
    align?: "start" | "center"
    /** Optional class on the outer label wrapper. */
    containerClassName?: string
    /** Class on the text block (label + description). */
    textClassName?: string
  }

/**
 * Switch with an inline label and optional description.
 * Renders a native `<label>` so clicking anywhere in the row toggles the switch.
 * Uses Framer Motion for a subtle hover lift on the whole row.
 */
function SwitchField({
  label,
  description,
  align = "start",
  size = "default",
  className,
  containerClassName,
  textClassName,
  disabled,
  previewFocused,
  ...props
}: SwitchFieldProps) {
  const reduce = disabled || previewFocused
  return (
    <motion.label
      whileHover={reduce ? undefined : { x: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn(
        "group/switch-field inline-flex w-fit gap-3",
        align === "center" ? "items-center" : "items-start",
        disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer",
        containerClassName,
      )}
    >
      <Switch
        size={size}
        disabled={disabled}
        previewFocused={previewFocused}
        className={cn(align === "start" && "mt-[2px]", className)}
        {...props}
      />
      <span
        className={cn(
          "flex min-w-0 flex-col gap-0.5 leading-tight",
          textClassName,
        )}
      >
        <span
          className={cn(
            "text-sm font-semibold text-foreground",
            size === "sm" && "text-[13px]",
          )}
        >
          {label}
        </span>
        {description ? (
          <span
            className={cn(
              "text-sm text-muted-foreground",
              size === "sm" && "text-[12px]",
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </motion.label>
  )
}

export { Switch, SwitchField }
export type { SwitchSize }
