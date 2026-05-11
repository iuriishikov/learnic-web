"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { FieldShell, type FieldShellProps } from "@/shared/ui/field-shell"
import { optionRowCls } from "@/shared/ui/overlay"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

export type MultiSelectOption = {
  value: string
  label: React.ReactNode
  /** Trailing muted text shown next to the label (e.g. "12 users"). */
  meta?: React.ReactNode
  /** Optional searchable text fallback when `label` is not a plain string. */
  searchValue?: string
  disabled?: boolean
}

export type MultiSelectLabels = {
  searchPlaceholder?: string
  resetLabel?: React.ReactNode
  selectAllLabel?: React.ReactNode
  emptyTitle?: React.ReactNode
  emptyDescription?: React.ReactNode
  clearSearchLabel?: React.ReactNode
}

export type MultiSelectSummary = {
  primary: React.ReactNode
  meta?: React.ReactNode
}

export type MultiSelectProps = Omit<FieldShellProps, "children"> & {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: React.ReactNode
  /** Custom trigger summary built from currently selected options. */
  formatSummary?: (selected: MultiSelectOption[]) => MultiSelectSummary
  labels?: MultiSelectLabels
  triggerClassName?: string
  /** Demo: render trigger as if focused. */
  forceFocus?: boolean
  /** Demo: render the dropdown panel statically below the trigger. */
  previewOpen?: boolean
  /** Demo: force the empty search state inside `previewOpen`. */
  previewEmptySearch?: boolean
}

const DEFAULT_LABELS: Required<MultiSelectLabels> = {
  searchPlaceholder: "Search",
  resetLabel: "Reset",
  selectAllLabel: "Select all",
  emptyTitle: "No items found",
  emptyDescription: "Please try a different search term.",
  clearSearchLabel: "Clear search",
}

function stringifyLabel(label: React.ReactNode): string {
  if (typeof label === "string" || typeof label === "number") {
    return String(label)
  }
  return ""
}

function TriggerInner({
  value,
  placeholder,
  summary,
}: {
  value: string[]
  placeholder: React.ReactNode
  summary: MultiSelectSummary | null
}) {
  if (value.length === 0 || !summary) {
    return (
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {placeholder}
      </span>
    )
  }
  return (
    <motion.span
      key={value.length}
      initial={{ scale: 0.96, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="min-w-0 flex-1 truncate text-sm"
    >
      <span className="font-semibold text-foreground">{summary.primary}</span>
      {summary.meta != null && (
        <>
          {" "}
          <span className="text-muted-foreground">{summary.meta}</span>
        </>
      )}
    </motion.span>
  )
}

function buildSummary(
  value: string[],
  options: MultiSelectOption[],
  formatSummary?: (selected: MultiSelectOption[]) => MultiSelectSummary
): MultiSelectSummary | null {
  if (value.length === 0) return null
  const selected = options.filter((o) => value.includes(o.value))
  if (formatSummary) return formatSummary(selected)
  return {
    primary: `${value.length} selected`,
    meta: null,
  }
}

type PanelProps = {
  search: string
  setSearch: (next: string) => void
  filtered: MultiSelectOption[]
  value: string[]
  onToggle: (val: string) => void
  onReset: () => void
  onSelectAll: () => void
  labels: Required<MultiSelectLabels>
  reduceMotion: boolean
  inline?: boolean
}

function Panel({
  search,
  setSearch,
  filtered,
  value,
  onToggle,
  onReset,
  onSelectAll,
  labels,
  reduceMotion,
  inline,
}: PanelProps) {
  const inputId = React.useId()
  const showEmpty = filtered.length === 0

  return (
    <div
      data-slot="multi-select-panel"
      className={cn(
        "flex flex-col overflow-hidden bg-popover text-popover-foreground",
        inline
          ? "mt-1 w-full rounded-lg ring-1 ring-foreground/10 shadow-md"
          : "w-full"
      )}
    >
      <div className="p-2.5 pb-2">
        <label
          htmlFor={inputId}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-lg border border-input/60 bg-input/30 px-2.5 text-sm transition-colors",
            "focus-within:border-ring focus-within:bg-background focus-within:ring-3 focus-within:ring-ring/30"
          )}
        >
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            id={inputId}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setSearch("")}
              className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </label>
      </div>

      {showEmpty ? (
        <EmptyState
          search={search}
          onClear={() => setSearch("")}
          labels={labels}
        />
      ) : (
        <div className="max-h-72 overflow-y-auto overscroll-contain px-1.5 pb-1">
          <ul className="flex flex-col gap-0.5" role="listbox" aria-multiselectable>
            <AnimatePresence initial={false}>
              {filtered.map((option, i) => {
                const checked = value.includes(option.value)
                return (
                  <motion.li
                    key={option.value}
                    layout={reduceMotion ? false : "position"}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: -4 }
                    }
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: Math.min(i * 0.018, 0.18),
                              duration: 0.18,
                            },
                          }
                    }
                    exit={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    role="option"
                    aria-selected={checked}
                  >
                    <button
                      type="button"
                      disabled={option.disabled}
                      onClick={() => onToggle(option.value)}
                      data-checked={checked || undefined}
                      className={cn(
                        optionRowCls,
                        "hover:bg-muted focus-visible:bg-muted",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={option.disabled}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-semibold text-foreground">
                          {option.label}
                        </span>
                        {option.meta != null && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">
                              {option.meta}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border bg-popover px-2.5 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={value.length === 0}
          className="font-medium"
        >
          {labels.resetLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="font-medium"
        >
          {labels.selectAllLabel}
        </Button>
      </div>
    </div>
  )
}

function EmptyState({
  search,
  onClear,
  labels,
}: {
  search: string
  onClear: () => void
  labels: Required<MultiSelectLabels>
}) {
  return (
    <motion.div
      key={search}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center gap-1.5 px-4 py-5 text-center"
    >
      <div className="mb-1 grid size-9 place-items-center rounded-lg border border-border bg-background shadow-sm">
        <SearchIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{labels.emptyTitle}</p>
      <p className="max-w-[200px] text-xs text-muted-foreground">
        {labels.emptyDescription}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="text-sm font-medium text-brand transition-opacity hover:opacity-80"
      >
        {labels.clearSearchLabel}
      </button>
    </motion.div>
  )
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  formatSummary,
  labels: labelsProp,
  triggerClassName,
  forceFocus,
  previewOpen,
  previewEmptySearch,
  disabled,
  id,
  label,
  required,
  helpTooltip,
  hint,
  className,
}: MultiSelectProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const [search, setSearch] = React.useState(
    previewEmptySearch ? "zzzzzz" : ""
  )
  const reduceMotion = useReducedMotion() ?? false

  const filtered = React.useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => {
      const haystack =
        (o.searchValue ?? "") + " " + stringifyLabel(o.label)
      return haystack.toLowerCase().includes(q)
    })
  }, [options, search])

  const toggle = React.useCallback(
    (val: string) => {
      onChange(
        value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
      )
    },
    [onChange, value]
  )

  const reset = React.useCallback(() => onChange([]), [onChange])
  const selectAll = React.useCallback(() => {
    onChange(options.filter((o) => !o.disabled).map((o) => o.value))
  }, [onChange, options])

  const summary = buildSummary(value, options, formatSummary)

  const triggerCls = cn(
    "group/ms-trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none transition-colors",
    "hover:border-input/80",
    "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20",
    "data-[force-focus=true]:border-brand data-[force-focus=true]:ring-3 data-[force-focus=true]:ring-brand/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "dark:bg-input/20",
    triggerClassName
  )

  const triggerContent = (
    <>
      <TriggerInner
        value={value}
        placeholder={placeholder}
        summary={summary}
      />
      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded/ms-trigger:rotate-180" />
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
            search={search}
            setSearch={setSearch}
            filtered={filtered}
            value={value}
            onToggle={toggle}
            onReset={reset}
            onSelectAll={selectAll}
            labels={labels}
            reduceMotion={reduceMotion}
            inline
          />
        </div>
      ) : (
        <Popover>
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
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              value={value}
              onToggle={toggle}
              onReset={reset}
              onSelectAll={selectAll}
              labels={labels}
              reduceMotion={reduceMotion}
            />
          </PopoverContent>
        </Popover>
      )}
    </FieldShell>
  )
}
