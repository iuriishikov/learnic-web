"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckIcon, SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { FieldShell, type FieldShellProps } from "@/shared/ui/field-shell"
import type { SingleOption } from "@/shared/ui/single-select-v2"

export type TagSearchOption = SingleOption & {
  chipLabel?: React.ReactNode
  chipLeading?: React.ReactNode
}

export type TagSearchProps = Omit<FieldShellProps, "children"> & {
  options: TagSearchOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  endAdornment?: React.ReactNode
  triggerClassName?: string
  /** Demo: render trigger as if focused. */
  forceFocus?: boolean
  /** Demo: render dropdown statically below the trigger. */
  previewOpen?: boolean
}

function stringifyLabel(label: React.ReactNode): string {
  if (typeof label === "string" || typeof label === "number") return String(label)
  return ""
}

function Chip({
  option,
  onRemove,
  reduceMotion,
}: {
  option: TagSearchOption
  onRemove: () => void
  reduceMotion: boolean
}) {
  return (
    <motion.span
      layout={reduceMotion ? false : "position"}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="inline-flex h-6 max-w-full shrink-0 items-center gap-1 rounded-md border border-border bg-background pl-1 pr-0.5 text-xs font-medium text-foreground shadow-sm"
    >
      {(option.chipLeading ?? option.leading) && (
        <span className="flex size-4 shrink-0 items-center justify-center">
          {option.chipLeading ?? option.leading}
        </span>
      )}
      <span className="truncate">{option.chipLabel ?? option.label}</span>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove()
        }}
        aria-label="Remove"
        className="inline-flex size-4 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </motion.span>
  )
}

function Panel({
  options,
  value,
  onToggle,
  reduceMotion,
  inline,
}: {
  options: TagSearchOption[]
  value: string[]
  onToggle: (val: string) => void
  reduceMotion: boolean
  inline?: boolean
}) {
  return (
    <div
      data-slot="tag-search-panel"
      className={cn(
        "flex flex-col overflow-hidden bg-popover text-popover-foreground",
        "rounded-lg ring-1 ring-foreground/10 shadow-md",
        inline ? "mt-1 w-full" : "w-full"
      )}
    >
      <div className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
        <ul className="flex flex-col gap-0.5" role="listbox" aria-multiselectable>
          <AnimatePresence initial={false}>
            {options.map((option, i) => {
              const selected = value.includes(option.value)
              return (
                <motion.li
                  key={option.value}
                  layout={reduceMotion ? false : "position"}
                  initial={reduceMotion ? false : { opacity: 0, y: -3 }}
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: Math.min(i * 0.018, 0.18),
                            duration: 0.16,
                          },
                        }
                  }
                  role="option"
                  aria-selected={selected}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onToggle(option.value)}
                    disabled={option.disabled}
                    data-selected={selected || undefined}
                    className={cn(
                      "group/ts-item flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors",
                      "hover:bg-muted/60 focus-visible:bg-muted/80",
                      "data-selected:bg-muted/70",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {option.leading != null && (
                      <span className="flex size-5 shrink-0 items-center justify-center">
                        {option.leading}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                      <span className="truncate font-medium text-foreground">
                        {option.label}
                      </span>
                      {option.meta != null && (
                        <span className="truncate text-muted-foreground">
                          {option.meta}
                        </span>
                      )}
                    </span>
                    {selected && (
                      <motion.span
                        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 28,
                        }}
                        className="ml-auto inline-flex shrink-0 text-brand"
                      >
                        <CheckIcon className="size-4" />
                      </motion.span>
                    )}
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

export function TagSearch({
  options,
  value,
  onChange,
  placeholder = "Search",
  endAdornment,
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
}: TagSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion() ?? false

  React.useEffect(() => {
    if (previewOpen) return
    function onDocPointer(e: PointerEvent) {
      if (!wrapperRef.current) return
      if (wrapperRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", onDocPointer)
    return () => document.removeEventListener("pointerdown", onDocPointer)
  }, [previewOpen])

  const selectedOptions = React.useMemo(
    () =>
      value
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is TagSearchOption => Boolean(o)),
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter((o) => {
      const hay = (o.searchValue ?? "") + " " + stringifyLabel(o.label)
      return hay.toLowerCase().includes(q)
    })
  }, [options, query])

  const toggle = React.useCallback(
    (val: string) => {
      onChange(
        value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
      )
      setQuery("")
      inputRef.current?.focus()
    },
    [onChange, value]
  )

  const removeLast = React.useCallback(() => {
    if (value.length === 0) return
    onChange(value.slice(0, -1))
  }, [onChange, value])

  const triggerCls = cn(
    "group/ts-trigger flex min-h-10 w-full cursor-text items-start gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-sm outline-none transition-colors",
    "focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20",
    "data-[force-focus=true]:border-brand data-[force-focus=true]:ring-3 data-[force-focus=true]:ring-brand/20",
    "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
    "dark:bg-input/20",
    triggerClassName
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

  const showPanel = previewOpen || open

  return (
    <FieldShell {...fieldShellProps}>
      <div ref={wrapperRef} className="relative w-full">
        <div
          data-force-focus={forceFocus ? "true" : undefined}
          className={triggerCls}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus()
              setOpen(true)
            }
          }}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <SearchIcon className="my-1 size-4 shrink-0 text-muted-foreground" />
            <AnimatePresence initial={false}>
              {selectedOptions.map((option) => (
                <Chip
                  key={option.value}
                  option={option}
                  onRemove={() => toggle(option.value)}
                  reduceMotion={reduceMotion}
                />
              ))}
            </AnimatePresence>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && query === "") {
                  removeLast()
                } else if (e.key === "Escape") {
                  setOpen(false)
                }
              }}
              disabled={disabled}
              placeholder={selectedOptions.length === 0 ? placeholder : ""}
              autoComplete="off"
              spellCheck={false}
              className="h-7 min-w-[6ch] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              onFocus={() => setOpen(true)}
            />
          </div>
          {endAdornment && (
            <span className="flex h-7 shrink-0 items-center text-muted-foreground">
              {endAdornment}
            </span>
          )}
        </div>
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -4, scale: 0.98 }
              }
              transition={{ duration: 0.15 }}
              className={cn(
                previewOpen ? "relative" : "absolute left-0 right-0 top-full z-50 mt-1"
              )}
            >
              <Panel
                options={filteredOptions}
                value={value}
                onToggle={toggle}
                reduceMotion={reduceMotion}
                inline={previewOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FieldShell>
  )
}
