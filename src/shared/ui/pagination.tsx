"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/shared/ui/menu"

// ────────────────────────────────────────────────────────────────────────────
// Sizes (sm | md | lg)

type PaginationSize = "sm" | "md" | "lg"

const SIZE_CONTEXT = React.createContext<PaginationSize>("md")

function usePaginationSize(): PaginationSize {
  return React.useContext(SIZE_CONTEXT)
}

const NUMBER_BUTTON_SIZE: Record<PaginationSize, string> = {
  sm: "size-7 text-xs",
  md: "size-8 text-sm",
  lg: "size-9 text-sm",
}

const TEXT_BUTTON_HEIGHT: Record<PaginationSize, string> = {
  sm: "h-7 text-xs px-2",
  md: "h-8 text-sm px-2.5",
  lg: "h-9 text-sm px-3",
}

const ICON_BUTTON_SIZE: Record<PaginationSize, string> = {
  sm: "size-7",
  md: "size-8",
  lg: "size-9",
}

const ICON_GLYPH_SIZE: Record<PaginationSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
}

const ARROW_TEXT_GAP: Record<PaginationSize, string> = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2",
}

// ────────────────────────────────────────────────────────────────────────────
// Container

type PaginationAlign = "between" | "center" | "start" | "end"

const ALIGN_CLASS: Record<PaginationAlign, string> = {
  between: "justify-between",
  center: "justify-center",
  start: "justify-start",
  end: "justify-end",
}

type PaginationProps = React.ComponentProps<"nav"> & {
  size?: PaginationSize
  align?: PaginationAlign
}

function Pagination({
  className,
  size = "md",
  align = "between",
  ...props
}: PaginationProps) {
  return (
    <SIZE_CONTEXT.Provider value={size}>
      <nav
        role="navigation"
        aria-label="pagination"
        data-slot="pagination"
        data-size={size}
        className={cn(
          "flex w-full items-center gap-3 text-sm text-muted-foreground",
          ALIGN_CLASS[align],
          className,
        )}
        {...props}
      />
    </SIZE_CONTEXT.Provider>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Numbered list (the 1 2 3 … 8 9 10 cluster)

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  const size = usePaginationSize()
  const gap =
    size === "sm" ? "gap-0.5" : size === "lg" ? "gap-1.5" : "gap-1"
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center", gap, className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="pagination-item" className={cn(className)} {...props} />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Numbered page button

type PaginationLinkProps = React.ComponentProps<"button"> & {
  isActive?: boolean
  size?: PaginationSize
}

function PaginationLink({
  className,
  isActive,
  size: sizeProp,
  type = "button",
  children,
  ...props
}: PaginationLinkProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-link"
      data-active={isActive ? "" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-medium tabular-nums transition-colors outline-none select-none",
        "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        NUMBER_BUTTON_SIZE[size],
        isActive &&
          "bg-muted text-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Ellipsis

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const size = usePaginationSize()
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground",
        ICON_BUTTON_SIZE[size],
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className={ICON_GLYPH_SIZE[size]} />
      <span className="sr-only">More pages</span>
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Previous / Next (text + arrow)
//
// `variant`:
//   - "link"    → no border, no padding (rows 1–2 in the design)
//   - "outline" → bordered button (rows 3–6 in the design)

type ArrowVariant = "link" | "outline"

type PaginationArrowProps = React.ComponentProps<"button"> & {
  variant?: ArrowVariant
  size?: PaginationSize
  /** Override the default "Previous" / "Next" label */
  text?: React.ReactNode
  /** Hide the text label (used on mobile / tight layouts) */
  hideText?: boolean
}

function arrowClasses(variant: ArrowVariant, size: PaginationSize) {
  const base =
    "inline-flex cursor-pointer items-center justify-center rounded-md font-medium text-foreground transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
  if (variant === "outline") {
    return cn(
      base,
      "border border-input bg-background hover:bg-muted/60",
      TEXT_BUTTON_HEIGHT[size],
      ARROW_TEXT_GAP[size],
    )
  }
  return cn(
    base,
    "hover:text-foreground hover:bg-transparent",
    "bg-transparent",
    // text-only link variant — minimal padding, no border
    size === "sm" ? "h-7 text-xs" : size === "lg" ? "h-9 text-sm" : "h-8 text-sm",
    ARROW_TEXT_GAP[size],
  )
}

function PaginationPrevious({
  className,
  variant = "link",
  size: sizeProp,
  text = "Previous",
  hideText,
  type = "button",
  children,
  ...props
}: PaginationArrowProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-previous"
      data-variant={variant}
      aria-label="Go to previous page"
      className={cn(arrowClasses(variant, size), className)}
      {...props}
    >
      <ArrowLeftIcon className={ICON_GLYPH_SIZE[size]} />
      {!hideText && <span>{children ?? text}</span>}
    </button>
  )
}

function PaginationNext({
  className,
  variant = "link",
  size: sizeProp,
  text = "Next",
  hideText,
  type = "button",
  children,
  ...props
}: PaginationArrowProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-next"
      data-variant={variant}
      aria-label="Go to next page"
      className={cn(arrowClasses(variant, size), className)}
      {...props}
    >
      {!hideText && <span>{children ?? text}</span>}
      <ArrowRightIcon className={ICON_GLYPH_SIZE[size]} />
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Icon-only step buttons (single chevron) — used for the compact
// `[←] Page X of Y [→]` layout in the rightmost column of the design.

type PaginationIconStepProps = React.ComponentProps<"button"> & {
  size?: PaginationSize
}

function iconStepClasses(size: PaginationSize) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors outline-none select-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
    ICON_BUTTON_SIZE[size],
  )
}

function PaginationPrevStep({
  className,
  size: sizeProp,
  type = "button",
  ...props
}: PaginationIconStepProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-prev-step"
      aria-label="Go to previous page"
      className={cn(iconStepClasses(size), className)}
      {...props}
    >
      <ChevronLeftIcon className={ICON_GLYPH_SIZE[size]} />
    </button>
  )
}

function PaginationNextStep({
  className,
  size: sizeProp,
  type = "button",
  ...props
}: PaginationIconStepProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-next-step"
      aria-label="Go to next page"
      className={cn(iconStepClasses(size), className)}
      {...props}
    >
      <ChevronRightIcon className={ICON_GLYPH_SIZE[size]} />
    </button>
  )
}

function PaginationFirst({
  className,
  size: sizeProp,
  type = "button",
  ...props
}: PaginationIconStepProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-first"
      aria-label="Go to first page"
      className={cn(iconStepClasses(size), className)}
      {...props}
    >
      <ChevronsLeftIcon className={ICON_GLYPH_SIZE[size]} />
    </button>
  )
}

function PaginationLast({
  className,
  size: sizeProp,
  type = "button",
  ...props
}: PaginationIconStepProps) {
  const ctxSize = usePaginationSize()
  const size = sizeProp ?? ctxSize
  return (
    <button
      type={type}
      data-slot="pagination-last"
      aria-label="Go to last page"
      className={cn(iconStepClasses(size), className)}
      {...props}
    >
      <ChevronsRightIcon className={ICON_GLYPH_SIZE[size]} />
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Text helpers

type PaginationStatusProps = React.ComponentProps<"span"> & {
  current: number | string
  total: number | string
  /** "Page" / "Showing page" — defaults to "Page" */
  label?: React.ReactNode
}

function PaginationStatus({
  className,
  current,
  total,
  label = "Page",
  ...props
}: PaginationStatusProps) {
  return (
    <span
      data-slot="pagination-status"
      className={cn(
        "inline-flex items-center gap-1 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      {label} <span className="tabular-nums">{current}</span> of{" "}
      <span className="tabular-nums">{total}</span>
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page number input — `Page [ 1 ] of 10`

type PaginationPageInputProps = {
  value: number
  total: number
  onValueChange: (value: number) => void
  /** Label rendered before the input ("Page" / "Showing page") */
  label?: React.ReactNode
  className?: string
  inputClassName?: string
}

function PaginationPageInput({
  value,
  total,
  onValueChange,
  label = "Page",
  className,
  inputClassName,
}: PaginationPageInputProps) {
  // Local draft so the user can type freely. Re-sync from the prop during
  // render when the controlled value changes (the React-recommended pattern
  // for deriving state from props without an effect).
  const [draft, setDraft] = React.useState(String(value))
  const [lastValue, setLastValue] = React.useState(value)
  if (lastValue !== value) {
    setLastValue(value)
    setDraft(String(value))
  }

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    const next = Math.min(Math.max(parsed, 1), total)
    setDraft(String(next))
    if (next !== value) onValueChange(next)
  }

  return (
    <span
      data-slot="pagination-page-input"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-foreground",
        className,
      )}
    >
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit((e.target as HTMLInputElement).value)
          }
        }}
        className={cn(
          "h-8 w-12 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
          inputClassName,
        )}
        aria-label="Page number"
      />
      <span className="text-muted-foreground">of</span>
      <span className="tabular-nums">{total}</span>
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Rows-per-page Select

type PaginationRowsPerPageProps = {
  value: number
  options?: number[]
  onValueChange: (value: number) => void
  /** Label rendered before the select. Defaults to none. */
  label?: React.ReactNode
  /** Format the selected display, defaults to "{n} per page". */
  format?: (value: number) => string
  className?: string
}

function PaginationRowsPerPage({
  value,
  options = [10, 20, 50, 100],
  onValueChange,
  label,
  format = (n) => `${n} per page`,
  className,
}: PaginationRowsPerPageProps) {
  return (
    <span
      data-slot="pagination-rows-per-page"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-foreground",
        className,
      )}
    >
      {label && <span className="text-foreground">{label}</span>}
      <Menu>
        <MenuTrigger
          className={cn(
            "inline-flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded-md border border-input bg-background py-1 pr-2 pl-2.5 text-sm whitespace-nowrap text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/40",
          )}
        >
          <span>{format(value)}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </MenuTrigger>
        <MenuContent size="md" align="start">
          <MenuGroup>
            <MenuRadioGroup
              value={String(value)}
              onValueChange={(v) => onValueChange(Number(v))}
            >
              {options.map((opt) => (
                <MenuRadioItem key={opt} value={String(opt)}>
                  {format(opt)}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Divider — the vertical `|` separator in the compact layouts

function PaginationDivider({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-divider"
      className={cn("inline-block h-5 w-px bg-border", className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page-range helper — produces the `1 2 3 … 8 9 10` sequence with ellipsis

export type PaginationRangeItem = number | "ellipsis"

/**
 * Edge-anchored page range: always exposes the first `edge` and last `edge`
 * pages and stitches the active page (with one neighbour on each side) into
 * the middle via ellipses. This is what the design uses — current=1 renders
 * `1 2 3 … 8 9 10`, current=5 renders `1 2 3 … 4 5 6 … 8 9 10`.
 */
export function paginationRange(
  current: number,
  total: number,
  edge = 3,
): PaginationRangeItem[] {
  if (total <= edge * 2 + 1) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const firstEdge: number[] = Array.from({ length: edge }, (_, i) => i + 1)
  const lastEdge: number[] = Array.from(
    { length: edge },
    (_, i) => total - edge + 1 + i,
  )

  // Current sits inside one of the edges → no middle group needed.
  if (current <= edge || current >= total - edge + 1) {
    return [...firstEdge, "ellipsis", ...lastEdge]
  }

  // Build the middle group with one neighbour on each side, deduplicated
  // against the edges.
  const middleSet = new Set<number>()
  for (let p = current - 1; p <= current + 1; p++) {
    if (p > edge && p < total - edge + 1) middleSet.add(p)
  }
  const middle = [...middleSet].sort((a, b) => a - b)

  return [...firstEdge, "ellipsis", ...middle, "ellipsis", ...lastEdge]
}

// ────────────────────────────────────────────────────────────────────────────

export {
  Pagination,
  PaginationContent,
  PaginationDivider,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationNextStep,
  PaginationPageInput,
  PaginationPrevStep,
  PaginationPrevious,
  PaginationRowsPerPage,
  PaginationStatus,
  type PaginationSize,
}
