import { cn } from "@/shared/lib/utils"

/**
 * Visual primitives for dropdown-style overlays (Menu, Select, Combobox,
 * DropdownMenu, ContextMenu, ...). Each consumer wraps its own Base UI primitive
 * with these class strings so popups, option rows, indicators, and section
 * slots share one visual language.
 *
 * Contract for option rows: the parent option element must carry the
 * `group/overlay-option` class (already baked into `optionRowCls`) and may
 * carry `data-variant="destructive"`. Inner slots (title, description, leading
 * icon, submenu chevron) react via `group-data-…/overlay-option:` variants.
 */

// ────────────────────────────────────────────────────────────────────────────
// Sizing

export type OverlaySize = "sm" | "md" | "lg"

export const overlaySizeWidthClass: Record<OverlaySize, string> = {
  sm: "min-w-44",
  md: "min-w-56",
  lg: "min-w-64",
}

// ────────────────────────────────────────────────────────────────────────────
// Popup container — apply to whatever the primitive calls "Popup" / "Content".
//
// `overlayPopupChromeCls` is the pure chrome (rounded + bg + shadow + ring +
// origin + side-aware slide-in + fade/zoom). Use it when the consumer primitive
// brings its own internal layout / scrolling (e.g. Select with its own List +
// ScrollArrows).
//
// `overlayPopupCls` adds Menu-style layout (flex column, max-size constraints,
// overflow-hidden) on top of the chrome — use it for popups that stack
// header / items / footer vertically and clip overflow at the outer container.

export const overlayPopupChromeCls = cn(
  // A solid `ring-border` (not a faint translucent ring) draws a crisp 1px edge
  // on every side. `bg-popover` equals `bg-background` in light theme, so the
  // popup would otherwise blend into a light surface on the sides the downward
  // `shadow-lg` doesn't reinforce (top/left) and read as if its border were
  // clipped — matching the trigger's solid `border-input` keeps the edge visible.
  "rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-border origin-(--transform-origin) outline-none duration-150 ease-out",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
)

export const overlayPopupCls = cn(
  overlayPopupChromeCls,
  "flex max-h-(--available-height) max-w-(--available-width) flex-col overflow-hidden"
)

// ────────────────────────────────────────────────────────────────────────────
// Option row — apply to whatever the primitive calls "Item". The class includes
// `group/overlay-option`, so inner slots can target it with
// `group-data-…/overlay-option:` variants.

export const optionRowCls = cn(
  "group/overlay-option relative flex w-full cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm outline-none transition-[background-color,color,transform,box-shadow] duration-150 ease-out select-none active:scale-[0.985] active:duration-75",
  "data-highlighted:bg-muted data-[popup-open]:bg-muted data-popup-open:bg-muted",
  "data-selected:bg-muted/60 data-[selected]:bg-muted/60",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:transition-[color,transform] [&_svg]:duration-150"
)

/** Apply alongside `optionRowCls` to opt the row into destructive coloring.
 *  The parent must also set `data-variant="destructive"` so child slots
 *  (title, description, leading icon) recolor through `group-data-[variant=…]`. */
export const optionDestructiveCls =
  "text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive [&_svg]:text-destructive"

/** Full-bleed footer button row that sits at the bottom of an overlay. */
export const overlayFooterButtonCls = cn(
  "group/overlay-option flex w-full cursor-pointer items-center gap-2.5 border-t border-border px-3 py-2 text-left text-sm font-medium outline-none transition-colors",
  "data-highlighted:bg-muted",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
)

// ────────────────────────────────────────────────────────────────────────────
// Inner slot styles — what `OptionContent` uses, also reusable by consumers
// who build their own option layouts.

export const optionLeadingIconCls =
  "flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-[color,transform] duration-150 group-data-highlighted/overlay-option:scale-110 group-data-highlighted/overlay-option:text-foreground group-data-[variant=destructive]/overlay-option:text-destructive"

export const optionTitleCls =
  "truncate font-medium text-foreground group-data-[variant=destructive]/overlay-option:text-destructive"

export const optionDescriptionCls =
  "truncate text-xs text-muted-foreground group-data-[variant=destructive]/overlay-option:text-destructive/80"

export const optionSubmenuArrowCls =
  "size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-highlighted/overlay-option:translate-x-0.5 group-data-[popup-open]/overlay-option:translate-x-0.5 group-data-popup-open/overlay-option:translate-x-0.5"

export const optionShortcutCls =
  "ml-auto text-xs font-medium tracking-tight text-muted-foreground"

// ────────────────────────────────────────────────────────────────────────────
// Selection-indicator slots — the visual container the primitive's
// *.ItemIndicator goes in. The inner check / dot is supplied by the consumer.

/** Leading check at the very left (Show bookmarks ✓ pattern). */
export const optionLeadingCheckSlotCls =
  "flex size-4 shrink-0 items-center justify-center text-brand"

/** Leading checkbox box for multi-select lists; fills with brand when checked. */
export const optionLeadingBoxSlotCls =
  "relative grid size-4 shrink-0 place-items-center rounded-[4px] border border-input transition-colors group-data-checked/overlay-option:border-brand group-data-checked/overlay-option:bg-brand"

/** Trailing check (puts a check on the right). */
export const optionTrailingCheckSlotCls =
  "flex size-4 shrink-0 items-center justify-center text-brand"

/** Radio dot ring (outer); brand-fills when the item is checked. */
export const optionRadioDotSlotCls =
  "relative grid size-4 shrink-0 place-items-center rounded-full border border-input transition-colors group-data-checked/overlay-option:border-brand group-data-checked/overlay-option:bg-brand"

/** Inner dot for the radio indicator. Use with the motion config below. */
export const overlayRadioDotInnerCls = "block size-1.5 rounded-full bg-brand-foreground"

/** Motion config for the radio dot (spread onto `motion.span`). */
export const overlayRadioDotMotion = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring" as const, stiffness: 600, damping: 28 },
}

// ────────────────────────────────────────────────────────────────────────────
// Section slot styles.

export const overlaySeparatorCls = "h-px bg-border"
export const overlayGroupCls = "flex flex-col p-1"
export const overlayLabelCls = "px-2 pb-1 pt-1.5 text-xs font-semibold text-brand"
export const overlayHeaderCls = "flex flex-col gap-0 px-3 py-2.5"
export const overlayFooterCls =
  "flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground"
export const overlayItemsCls = "flex max-h-80 flex-col overflow-y-auto p-1"
export const overlayUserCardCls = "flex items-center gap-2.5 px-3 py-2.5"
export const overlaySearchWrapCls = "border-b border-border p-2"
export const overlaySearchFieldCls = cn(
  "flex h-8 w-full items-center gap-1.5 rounded-md border border-input/60 bg-input/30 px-2 transition-colors",
  "focus-within:border-ring focus-within:bg-background focus-within:ring-3 focus-within:ring-ring/30"
)
