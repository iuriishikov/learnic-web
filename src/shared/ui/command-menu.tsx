"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { ArrowRightIcon, SearchIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { useIsMac } from "@/shared/lib/platform"
import { Dialog, DialogOverlay, DialogPortal } from "@/shared/ui/dialog"

/**
 * Command palette ("⌘K menu"). A richer surface than the generated `command.tsx`
 * shadcn wrapper: it reproduces the Untitled-UI command-menu language — search
 * header with a key hint, grouped result rows with leading icon/avatar,
 * description and trailing shortcut, branded empty states, a keyboard-hint
 * footer, and a two-pane master/detail layout.
 *
 * Built on `cmdk` (filtering + roving keyboard nav for free) inside the
 * project's Base UI Dialog primitive. The dialog popup is composed directly so
 * the enter/exit animation is opacity + slide only — no scale "pop".
 */

// ────────────────────────────────────────────────────────────────────────────
// Sizing

export type CommandMenuSize = "md" | "lg" | "xl"

const sizeWidthClass: Record<CommandMenuSize, string> = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
}

const popupChromeCls = cn(
  "fixed top-[10vh] left-1/2 z-50 flex w-[calc(100%-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none",
  "duration-200 ease-out data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-2 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-2"
)

// ────────────────────────────────────────────────────────────────────────────
// Keyboard chip — thin bordered chip used in the header hint, item shortcuts and
// the footer. Distinct from the filled `Kbd` primitive to match the references.

function CommandMenuKbd({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="command-menu-kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border bg-transparent px-1.5 font-sans text-[11px] font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Root

export type CommandMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** sr-only accessible name for the dialog. */
  title?: string
  /** sr-only accessible description for the dialog. */
  description?: string
  size?: CommandMenuSize
  /** Controlled highlighted value — pair with `onValueChange` for master/detail. */
  value?: string
  onValueChange?: (value: string) => void
  /** Let cmdk filter items as the user types. Default `true`. */
  shouldFilter?: boolean
  /** Wrap keyboard navigation at the list edges. Default `true`. */
  loop?: boolean
  className?: string
  children: React.ReactNode
}

function CommandMenu({
  open,
  onOpenChange,
  title = "Command menu",
  description = "Search and run a command",
  size = "lg",
  value,
  onValueChange,
  shouldFilter = true,
  loop = true,
  className,
  children,
}: CommandMenuProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <BaseDialog.Popup
          data-slot="command-menu"
          className={cn(popupChromeCls, sizeWidthClass[size], className)}
        >
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
          <BaseDialog.Description className="sr-only">
            {description}
          </BaseDialog.Description>
          <CommandPrimitive
            data-slot="command-menu-root"
            label={title}
            value={value}
            onValueChange={onValueChange}
            shouldFilter={shouldFilter}
            loop={loop}
            className="flex min-h-0 w-full flex-col overflow-hidden"
          >
            {children}
          </CommandPrimitive>
        </BaseDialog.Popup>
      </DialogPortal>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Search input

export type CommandMenuInputProps = React.ComponentProps<
  typeof CommandPrimitive.Input
> & {
  /** Trailing hint (right side). Defaults to a platform-aware `⌘/` chip. Pass `null` to hide. */
  hint?: React.ReactNode
  containerClassName?: string
}

function CommandMenuInput({
  className,
  hint,
  containerClassName,
  ...props
}: CommandMenuInputProps) {
  const isMac = useIsMac()
  const resolvedHint =
    hint === undefined ? (
      <CommandMenuKbd>{isMac ? "⌘/" : "Ctrl/"}</CommandMenuKbd>
    ) : (
      hint
    )

  return (
    <div
      data-slot="command-menu-input"
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b border-border px-4",
        containerClassName
      )}
    >
      <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        autoFocus
        className={cn(
          "h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
      {resolvedHint != null && (
        <span className="flex shrink-0 items-center">{resolvedHint}</span>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// List / Group / Separator

function CommandMenuList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-menu-list"
      className={cn(
        "max-h-[min(60vh,420px)] min-h-0 flex-1 scroll-py-2 overflow-x-hidden overflow-y-auto p-2 outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandMenuGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-menu-group"
      className={cn(
        "py-1 text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-menu-separator"
      className={cn("-mx-2 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Item

export type CommandMenuItemProps = React.ComponentProps<
  typeof CommandPrimitive.Item
> & {
  /** Leading icon, avatar or logo. */
  leading?: React.ReactNode
  /** Secondary line under the title. */
  description?: React.ReactNode
  /** Trailing content (typically `CommandMenuShortcut`). */
  trailing?: React.ReactNode
}

function CommandMenuItem({
  className,
  leading,
  description,
  trailing,
  children,
  ...props
}: CommandMenuItemProps) {
  return (
    <CommandPrimitive.Item
      data-slot="command-menu-item"
      className={cn(
        "group/cmd-item relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors select-none",
        "data-[selected=true]:bg-muted data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {leading != null && (
        <span className="flex shrink-0 items-center justify-center text-muted-foreground transition-colors group-data-[selected=true]/cmd-item:text-foreground">
          {leading}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">{children}</span>
        {description != null && (
          <span className="truncate text-[0.8125rem] leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {trailing != null && (
        <span className="ml-auto flex shrink-0 items-center">{trailing}</span>
      )}
    </CommandPrimitive.Item>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Shortcut — trailing key hints. `keys` renders one chip each; `sequence` joins
// them with a `→` (the "⌘K → P" pattern). `children` overrides for full control.

export type CommandMenuShortcutProps = {
  keys?: React.ReactNode[]
  sequence?: boolean
  className?: string
  children?: React.ReactNode
}

function CommandMenuShortcut({
  keys,
  sequence,
  className,
  children,
}: CommandMenuShortcutProps) {
  return (
    <span
      data-slot="command-menu-shortcut"
      className={cn("flex items-center gap-1", className)}
    >
      {children ??
        keys?.map((key, index) => (
          <React.Fragment key={index}>
            {sequence && index > 0 && (
              <ArrowRightIcon className="size-3 text-muted-foreground" />
            )}
            <CommandMenuKbd>{key}</CommandMenuKbd>
          </React.Fragment>
        ))}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state — centered illustration + title + description + optional actions.

export type CommandMenuEmptyProps = {
  /** Custom illustration; defaults to a search icon in a rounded box. */
  illustration?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Action buttons row. */
  children?: React.ReactNode
  className?: string
}

function CommandMenuEmpty({
  illustration,
  title,
  description,
  children,
  className,
}: CommandMenuEmptyProps) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-menu-empty"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {illustration ?? (
        <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
          <SearchIcon className="size-5" />
        </div>
      )}
      <p className="mt-5 text-base font-semibold text-foreground">{title}</p>
      {description != null && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children != null && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </CommandPrimitive.Empty>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Orbit illustration — concentric rings with scattered avatars around a center
// search icon (the "No users found" empty state).

const ORBIT_POSITIONS = [
  { top: "16%", left: "34%" },
  { top: "10%", left: "63%" },
  { top: "32%", left: "84%" },
  { top: "62%", left: "86%" },
  { top: "82%", left: "62%" },
  { top: "72%", left: "32%" },
  { top: "52%", left: "12%" },
  { top: "24%", left: "14%" },
] as const

export type CommandMenuOrbitProps = {
  avatars: React.ReactNode[]
  className?: string
}

function CommandMenuOrbit({ avatars, className }: CommandMenuOrbitProps) {
  return (
    <div
      data-slot="command-menu-orbit"
      className={cn("relative mx-auto size-56", className)}
      aria-hidden
    >
      <div className="absolute top-1/2 left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70" />
      <div className="absolute top-1/2 left-1/2 size-[100%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/45" />
      {avatars.slice(0, ORBIT_POSITIONS.length).map((avatar, index) => (
        <span
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2 opacity-90"
          style={ORBIT_POSITIONS[index]}
        >
          {avatar}
        </span>
      ))}
      <div className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-popover text-muted-foreground shadow-sm">
        <SearchIcon className="size-5" />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Footer — keyboard hint row.

export type CommandMenuHintProps = {
  keys: React.ReactNode[]
  label: React.ReactNode
  className?: string
}

function CommandMenuHint({ keys, label, className }: CommandMenuHintProps) {
  return (
    <span
      data-slot="command-menu-hint"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span className="flex items-center gap-1">
        {keys.map((key, index) => (
          <CommandMenuKbd key={index}>{key}</CommandMenuKbd>
        ))}
      </span>
      <span>{label}</span>
    </span>
  )
}

function CommandMenuFooter({
  className,
  children,
  action,
  ...props
}: React.ComponentProps<"div"> & { action?: React.ReactNode }) {
  return (
    <div
      data-slot="command-menu-footer"
      className={cn(
        "flex shrink-0 items-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-2.5 text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {children}
      </div>
      {action != null && <div className="ml-auto flex items-center">{action}</div>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Two-pane master/detail layout. Put `CommandMenuList` (master) and
// `CommandMenuPaneDetail` (detail) inside `CommandMenuPanes`. Drive the detail
// off the controlled `value` / `onValueChange` on `CommandMenu`.

function CommandMenuPanes({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-menu-panes"
      className={cn(
        "flex min-h-0 max-h-[min(60vh,440px)] divide-x divide-border",
        className
      )}
      {...props}
    />
  )
}

function CommandMenuPaneDetail({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-menu-pane-detail"
      className={cn(
        "hidden min-w-0 flex-1 overflow-y-auto p-5 sm:block",
        className
      )}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Search trigger — the bordered "Search ⌘K" box that lives in a header/toolbar
// and opens the palette on click.

export type CommandSearchTriggerProps = Omit<
  React.ComponentProps<"button">,
  "children"
> & {
  placeholder?: React.ReactNode
  /** Trailing key hint. Defaults to a platform-aware `⌘K` chip. Pass `null` to hide. */
  shortcut?: React.ReactNode
}

function CommandSearchTrigger({
  className,
  placeholder = "Search",
  shortcut,
  ...props
}: CommandSearchTriggerProps) {
  const isMac = useIsMac()
  const resolvedShortcut =
    shortcut === undefined ? (
      <CommandMenuKbd>{isMac ? "⌘K" : "Ctrl K"}</CommandMenuKbd>
    ) : (
      shortcut
    )

  return (
    <button
      type="button"
      data-slot="command-search-trigger"
      className={cn(
        "inline-flex h-9 w-44 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors outline-none md:w-56 lg:w-64",
        "hover:bg-muted/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        className
      )}
      {...props}
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="truncate text-left">{placeholder}</span>
      {resolvedShortcut != null && (
        <span className="ml-auto flex shrink-0 items-center">
          {resolvedShortcut}
        </span>
      )}
    </button>
  )
}

export {
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuSeparator,
  CommandMenuItem,
  CommandMenuShortcut,
  CommandMenuEmpty,
  CommandMenuOrbit,
  CommandMenuFooter,
  CommandMenuHint,
  CommandMenuPanes,
  CommandMenuPaneDetail,
  CommandMenuKbd,
  CommandSearchTrigger,
}
