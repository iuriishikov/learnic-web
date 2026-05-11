"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ChevronRightIcon, SearchIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

import {
  optionDescriptionCls,
  optionLeadingIconCls,
  optionShortcutCls,
  optionSubmenuArrowCls,
  optionTitleCls,
  overlayFooterCls,
  overlayHeaderCls,
  overlayItemsCls,
  overlayRadioDotInnerCls,
  overlayRadioDotMotion,
  overlaySearchFieldCls,
  overlaySearchWrapCls,
  overlayUserCardCls,
} from "./styles"

// ────────────────────────────────────────────────────────────────────────────
// Option content
//
// Standard layout inside an option row: leading icon, title + optional
// description, optional shortcut, optional trailing node, optional submenu
// chevron. Designed to be rendered as a direct child of an element styled with
// `optionRowCls` (which carries `group/overlay-option`) and optionally
// `data-variant="destructive"`.

export type OptionContentProps = {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  shortcut?: React.ReactNode
  description?: React.ReactNode
  hasSubmenuArrow?: boolean
  children: React.ReactNode
}

export function OptionContent({
  leading,
  trailing,
  shortcut,
  description,
  hasSubmenuArrow,
  children,
}: OptionContentProps) {
  return (
    <>
      {leading != null && (
        <span className={optionLeadingIconCls}>{leading}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={optionTitleCls}>{children}</span>
        {description != null && (
          <span className={optionDescriptionCls}>{description}</span>
        )}
      </span>
      {shortcut != null && (
        <span className={optionShortcutCls}>{shortcut}</span>
      )}
      {trailing}
      {hasSubmenuArrow && (
        <ChevronRightIcon className={optionSubmenuArrowCls} />
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Indicator inner — motion span for the radio dot. Pass as the `render` prop
// of the primitive's *.ItemIndicator (or as a child) so the spring fires when
// the item becomes checked.

export type OverlayRadioDotInnerProps = React.ComponentProps<typeof motion.span>

export function OverlayRadioDotInner({
  className,
  ref,
  ...props
}: OverlayRadioDotInnerProps & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <motion.span
      ref={ref}
      {...overlayRadioDotMotion}
      className={cn(overlayRadioDotInnerCls, className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Layout sections — pure presentational (no Base UI binding). Each consumer
// (menu, select, ...) uses them directly or wraps with its own data-slot.

export function OverlayHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="overlay-header"
      className={cn(overlayHeaderCls, className)}
      {...props}
    />
  )
}

export function OverlayFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="overlay-footer"
      className={cn(overlayFooterCls, className)}
      {...props}
    />
  )
}

export function OverlayItems({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="overlay-items"
      className={cn(overlayItemsCls, className)}
      {...props}
    />
  )
}

export function OverlayShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="overlay-shortcut"
      className={cn(optionShortcutCls, className)}
      {...props}
    />
  )
}

export type OverlayUserCardProps = {
  avatar?: React.ReactNode
  primary: React.ReactNode
  secondary?: React.ReactNode
  className?: string
}

export function OverlayUserCard({
  avatar,
  primary,
  secondary,
  className,
}: OverlayUserCardProps) {
  return (
    <div
      data-slot="overlay-user-card"
      className={cn(overlayUserCardCls, className)}
    >
      {avatar && <span className="shrink-0">{avatar}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {primary}
        </span>
        {secondary != null && (
          <span className="truncate text-xs text-muted-foreground">
            {secondary}
          </span>
        )}
      </span>
    </div>
  )
}

export type OverlaySearchProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> & {
  value: string
  onValueChange: (next: string) => void
  placeholder?: string
}

export function OverlaySearch({
  value,
  onValueChange,
  placeholder = "Search",
  className,
  ...props
}: OverlaySearchProps) {
  return (
    <div
      data-slot="overlay-search"
      className={cn(overlaySearchWrapCls, className)}
    >
      <label className={overlaySearchFieldCls}>
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          {...props}
        />
      </label>
    </div>
  )
}
