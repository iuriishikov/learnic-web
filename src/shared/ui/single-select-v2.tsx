"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { FieldShell, type FieldShellProps } from "@/shared/ui/field-shell"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

export type SingleOption = {
  value: string
  label: React.ReactNode
  /** Trailing muted suffix (e.g. "@olivia"). */
  meta?: React.ReactNode
  /** Leading decorator rendered inside the dropdown item (icon/avatar/dot). */
  leading?: React.ReactNode
  /** Fallback when `label` isn't a plain string. */
  searchValue?: string
  disabled?: boolean
}

export type SingleSelectV2Props = Omit<FieldShellProps, "children"> & {
  options: SingleOption[]
  value: string | null
  onChange: (next: string | null) => void
  placeholder?: React.ReactNode
  /** Leading decorator inside the trigger when nothing is selected. */
  triggerLeading?: React.ReactNode
  /** When true, the selected option's `leading` replaces `triggerLeading`. */
  mirrorOptionLeading?: boolean
  /** Replaces the trailing chevron when provided (e.g. ⌘K kbd). */
  endAdornment?: React.ReactNode
  /** Hide the trailing chevron when no endAdornment is set. */
  hideChevron?: boolean
  /** Show a check icon on the right of the currently selected item. */
  markSelectedWithCheck?: boolean
  triggerClassName?: string
  /** Demo: render trigger as if focused. */
  forceFocus?: boolean
  /** Demo: render dropdown statically below the trigger. */
  previewOpen?: boolean
}

function ItemRow({
  option,
  selected,
  showCheck,
  onSelect,
  index,
  reduceMotion,
}: {
  option: SingleOption
  selected: boolean
  showCheck: boolean
  onSelect: (val: string) => void
  index: number
  reduceMotion: boolean
}) {
  return (
    <motion.li
      role="option"
      aria-selected={selected}
      initial={reduceMotion ? false : { opacity: 0, y: -3 }}
      animate={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              transition: {
                delay: Math.min(index * 0.018, 0.18),
                duration: 0.16,
              },
            }
      }
    >
      <button
        type="button"
        disabled={option.disabled}
        onClick={() => onSelect(option.value)}
        data-selected={selected || undefined}
        className={cn(
          "group/single-item flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors",
          "hover:bg-muted/60 focus-visible:bg-muted/80",
          "data-selected:bg-muted/70",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {option.leading != null && (
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            {option.leading}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-foreground">{option.label}</span>
          {option.meta != null && (
            <>
              {" "}
              <span className="text-muted-foreground">{option.meta}</span>
            </>
          )}
        </span>
        {showCheck && selected && (
          <motion.span
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="ml-auto inline-flex shrink-0 text-brand"
          >
            <CheckIcon className="size-4" />
          </motion.span>
        )}
      </button>
    </motion.li>
  )
}

function Panel({
  options,
  value,
  onSelect,
  markSelectedWithCheck,
  reduceMotion,
  inline,
}: {
  options: SingleOption[]
  value: string | null
  onSelect: (val: string) => void
  markSelectedWithCheck: boolean
  reduceMotion: boolean
  inline?: boolean
}) {
  return (
    <div
      data-slot="single-select-panel"
      className={cn(
        "flex flex-col overflow-hidden bg-popover text-popover-foreground",
        inline
          ? "mt-1 w-full rounded-lg ring-1 ring-foreground/10 shadow-md"
          : "w-full"
      )}
    >
      <div className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
        <ul className="flex flex-col gap-0.5" role="listbox">
          <AnimatePresence initial={false}>
            {options.map((option, i) => (
              <ItemRow
                key={option.value}
                option={option}
                selected={value === option.value}
                showCheck={markSelectedWithCheck}
                onSelect={onSelect}
                index={i}
                reduceMotion={reduceMotion}
              />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

export function SingleSelectV2({
  options,
  value,
  onChange,
  placeholder = "Select",
  triggerLeading,
  mirrorOptionLeading,
  endAdornment,
  hideChevron,
  markSelectedWithCheck = true,
  triggerClassName,
  forceFocus,
  previewOpen,
  disabled,
  id,
  label,
  required,
  helpTooltip,
  hint,
  className,
}: SingleSelectV2Props) {
  const [open, setOpen] = React.useState(false)
  const reduceMotion = useReducedMotion() ?? false

  const selectedOption =
    value != null ? options.find((o) => o.value === value) ?? null : null

  const handleSelect = React.useCallback(
    (val: string) => {
      onChange(val)
      setOpen(false)
    },
    [onChange]
  )

  const resolvedLeading =
    mirrorOptionLeading && selectedOption?.leading != null
      ? selectedOption.leading
      : triggerLeading

  const triggerCls = cn(
    "group/ss-trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none transition-colors",
    "hover:border-input/80",
    "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20",
    "data-[force-focus=true]:border-brand data-[force-focus=true]:ring-3 data-[force-focus=true]:ring-brand/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "dark:bg-input/20",
    triggerClassName
  )

  const triggerContent = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {resolvedLeading != null && (
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            {resolvedLeading}
          </span>
        )}
        {selectedOption ? (
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="truncate font-medium text-foreground">
              {selectedOption.label}
            </span>
            {selectedOption.meta != null && (
              <span className="truncate text-muted-foreground">
                {selectedOption.meta}
              </span>
            )}
          </span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
      </span>
      {endAdornment ? (
        <span className="flex shrink-0 items-center text-muted-foreground">
          {endAdornment}
        </span>
      ) : hideChevron ? null : (
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded/ss-trigger:rotate-180" />
      )}
    </>
  )

  const fieldShellProps = {
    id,
    label,
    required,
    helpTooltip,
    hint,
    disabled,
    className,
  }

  return (
    <FieldShell {...fieldShellProps}>
      {previewOpen ? (
        <div className="flex w-full flex-col">
          <button
            type="button"
            disabled={disabled}
            data-force-focus={forceFocus ? "true" : undefined}
            className={triggerCls}
            aria-expanded
            aria-haspopup="listbox"
          >
            {triggerContent}
          </button>
          <Panel
            options={options}
            value={value}
            onSelect={onChange}
            markSelectedWithCheck={markSelectedWithCheck}
            reduceMotion={reduceMotion}
            inline
          />
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            data-force-focus={forceFocus ? "true" : undefined}
            className={triggerCls}
          >
            {triggerContent}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-(--anchor-width) min-w-(--anchor-width) max-w-(--anchor-width) gap-0 p-0"
          >
            <Panel
              options={options}
              value={value}
              onSelect={handleSelect}
              markSelectedWithCheck={markSelectedWithCheck}
              reduceMotion={reduceMotion}
            />
          </PopoverContent>
        </Popover>
      )}
    </FieldShell>
  )
}
