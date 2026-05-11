"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { CheckIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Switch } from "@/shared/ui/switch"
import {
  OptionContent,
  OverlayFooter,
  OverlayHeader,
  OverlayItems,
  OverlayRadioDotInner,
  OverlaySearch,
  OverlayUserCard,
  optionDescriptionCls,
  optionDestructiveCls,
  optionLeadingBoxSlotCls,
  optionLeadingCheckSlotCls,
  optionLeadingIconCls,
  optionRadioDotSlotCls,
  optionRowCls,
  optionShortcutCls,
  optionTitleCls,
  optionTrailingCheckSlotCls,
  overlayFooterButtonCls,
  overlayGroupCls,
  overlayLabelCls,
  overlayPopupCls,
  overlaySeparatorCls,
  overlaySizeWidthClass,
  type OverlaySize,
  type OverlayUserCardProps,
  type OverlaySearchProps,
} from "@/shared/ui/overlay"

// ────────────────────────────────────────────────────────────────────────────
// Root / Trigger / Content

function Menu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />
}

function MenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}

export type MenuContentSize = OverlaySize

type MenuContentProps = MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    size?: MenuContentSize
  }

function MenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  size = "md",
  className,
  children,
  ...props
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(overlayPopupCls, overlaySizeWidthClass[size], className)}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section / Group / Label

function MenuGroup({ className, ...props }: MenuPrimitive.Group.Props) {
  return (
    <MenuPrimitive.Group
      data-slot="menu-group"
      className={cn(overlayGroupCls, className)}
      {...props}
    />
  )
}

function MenuLabel({
  className,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="menu-label"
      className={cn(overlayLabelCls, className)}
      {...props}
    />
  )
}

function MenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn(overlaySeparatorCls, className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Item

type MenuItemBaseProps = {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  shortcut?: React.ReactNode
  description?: React.ReactNode
  hasSubmenuArrow?: boolean
  variant?: "default" | "destructive"
}

export type MenuItemProps = MenuPrimitive.Item.Props & MenuItemBaseProps

function MenuItem({
  className,
  leading,
  trailing,
  shortcut,
  description,
  hasSubmenuArrow,
  variant = "default",
  children,
  ...props
}: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={variant}
      className={cn(
        optionRowCls,
        variant === "destructive" && optionDestructiveCls,
        className
      )}
      {...props}
    >
      <OptionContent
        leading={leading}
        trailing={trailing}
        shortcut={shortcut}
        description={description}
        hasSubmenuArrow={hasSubmenuArrow}
      >
        {children}
      </OptionContent>
    </MenuPrimitive.Item>
  )
}

function MenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn(optionShortcutCls, className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Submenu

function MenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />
}

export type MenuSubTriggerProps = MenuPrimitive.SubmenuTrigger.Props &
  MenuItemBaseProps

function MenuSubTrigger({
  className,
  leading,
  trailing,
  shortcut,
  description,
  children,
  ...props
}: MenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={cn(optionRowCls, className)}
      {...props}
    >
      <OptionContent
        leading={leading}
        trailing={trailing}
        shortcut={shortcut}
        description={description}
        hasSubmenuArrow
      >
        {children}
      </OptionContent>
    </MenuPrimitive.SubmenuTrigger>
  )
}

function MenuSubContent({
  align = "start",
  alignOffset = -4,
  side = "right",
  sideOffset = 4,
  size = "md",
  className,
  children,
  ...props
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-sub-content"
          className={cn(overlayPopupCls, overlaySizeWidthClass[size], className)}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Radio (single-selected with dot indicator on the right)

function MenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
}

export type MenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  leading?: React.ReactNode
  description?: React.ReactNode
  shortcut?: React.ReactNode
}

function MenuRadioItem({
  className,
  leading,
  description,
  shortcut,
  children,
  ...props
}: MenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={cn(optionRowCls, className)}
      {...props}
    >
      {leading != null && (
        <span className={optionLeadingIconCls}>{leading}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={optionTitleCls}>{children}</span>
        {description != null && (
          <span className={optionDescriptionCls}>{description}</span>
        )}
      </span>
      {shortcut != null && <MenuShortcut>{shortcut}</MenuShortcut>}
      <span
        data-slot="menu-radio-indicator"
        aria-hidden
        className={optionRadioDotSlotCls}
      >
        <MenuPrimitive.RadioItemIndicator render={<OverlayRadioDotInner />} />
      </span>
    </MenuPrimitive.RadioItem>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Checkbox (with leading checkbox-shaped indicator OR trailing check mark)

export type MenuCheckboxItemProps = MenuPrimitive.CheckboxItem.Props & {
  leading?: React.ReactNode
  description?: React.ReactNode
  shortcut?: React.ReactNode
  /** Where to draw the indicator. "leading-check" places a "✓" at the very left
   *  (for "Show bookmarks ✓" pattern). "leading-box" draws a checkbox on the
   *  left for multi-select lists. "trailing" puts a check on the right. */
  indicator?: "leading-check" | "leading-box" | "trailing"
}

function MenuCheckboxItem({
  className,
  leading,
  description,
  shortcut,
  indicator = "leading-check",
  children,
  ...props
}: MenuCheckboxItemProps) {
  const showLeadingCheck = indicator === "leading-check"
  const showLeadingBox = indicator === "leading-box"
  const showTrailing = indicator === "trailing"
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(optionRowCls, className)}
      {...props}
    >
      {showLeadingCheck && (
        <span
          data-slot="menu-leading-check"
          aria-hidden
          className={optionLeadingCheckSlotCls}
        >
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon className="size-4" />
          </MenuPrimitive.CheckboxItemIndicator>
        </span>
      )}
      {showLeadingBox && (
        <span
          data-slot="menu-leading-box"
          aria-hidden
          className={optionLeadingBoxSlotCls}
        >
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon className="size-3 text-brand-foreground" />
          </MenuPrimitive.CheckboxItemIndicator>
        </span>
      )}
      {leading != null && (
        <span className={optionLeadingIconCls}>{leading}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={optionTitleCls}>{children}</span>
        {description != null && (
          <span className={optionDescriptionCls}>{description}</span>
        )}
      </span>
      {shortcut != null && <MenuShortcut>{shortcut}</MenuShortcut>}
      {showTrailing && (
        <span aria-hidden className={optionTrailingCheckSlotCls}>
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon className="size-4" />
          </MenuPrimitive.CheckboxItemIndicator>
        </span>
      )}
    </MenuPrimitive.CheckboxItem>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Switch — toggle row (like "Dark mode")

export type MenuSwitchItemProps = Omit<
  MenuPrimitive.Item.Props,
  "onClick"
> & {
  leading?: React.ReactNode
  description?: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

function MenuSwitchItem({
  className,
  leading,
  description,
  checked,
  onCheckedChange,
  disabled,
  children,
  ...props
}: MenuSwitchItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-switch-item"
      closeOnClick={false}
      disabled={disabled}
      className={cn(optionRowCls, "cursor-pointer", className)}
      onClick={(e) => {
        e.preventDefault()
        if (!disabled) onCheckedChange?.(!checked)
      }}
      {...props}
    >
      {leading != null && (
        <span className={optionLeadingIconCls}>{leading}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={optionTitleCls}>{children}</span>
        {description != null && (
          <span className={optionDescriptionCls}>{description}</span>
        )}
      </span>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        onClick={(e) => e.stopPropagation()}
      />
    </MenuPrimitive.Item>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Menu-flavored wrappers for the shared overlay slots (preserve data-slot
// identity within Menu without duplicating styling).

function MenuHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <OverlayHeader
      data-slot="menu-header"
      className={className}
      {...props}
    />
  )
}

function MenuFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <OverlayFooter
      data-slot="menu-footer"
      className={className}
      {...props}
    />
  )
}

function MenuItems({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <OverlayItems
      data-slot="menu-items"
      className={className}
      {...props}
    />
  )
}

function MenuUserCard(props: OverlayUserCardProps) {
  return <OverlayUserCard {...props} />
}

function MenuSearch(props: OverlaySearchProps) {
  return <OverlaySearch {...props} />
}

function MenuFooterButton({
  className,
  leading,
  hasSubmenuArrow,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  leading?: React.ReactNode
  hasSubmenuArrow?: boolean
}) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-footer-button"
      className={cn(overlayFooterButtonCls, className)}
      {...props}
    >
      <OptionContent leading={leading} hasSubmenuArrow={hasSubmenuArrow}>
        {children}
      </OptionContent>
    </MenuPrimitive.Item>
  )
}

// Boxed action button — contained outline button at the bottom of a menu (the
// "Sign out" pattern from Untitled UI account menus). Unlike `MenuFooterButton`
// which is full-bleed with a top border, this sits inside the menu's padding
// with a rounded border on all sides and centered content. Pair with
// `MenuSeparator` above for the divider.
export type MenuActionButtonProps = MenuPrimitive.Item.Props & {
  leading?: React.ReactNode
}

function MenuActionButton({
  className,
  leading,
  children,
  ...props
}: MenuActionButtonProps) {
  return (
    <div className="p-1">
      <MenuPrimitive.Item
        data-slot="menu-action-button"
        className={cn(
          optionRowCls,
          "justify-center rounded-md border border-input bg-transparent px-3 py-2 font-medium text-foreground",
          className
        )}
        {...props}
      >
        {leading != null && (
          <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-150 group-data-highlighted/overlay-option:text-foreground">
            {leading}
          </span>
        )}
        <span className="truncate">{children}</span>
      </MenuPrimitive.Item>
    </div>
  )
}

export {
  Menu,
  MenuActionButton,
  MenuContent,
  MenuFooter,
  MenuFooterButton,
  MenuGroup,
  MenuHeader,
  MenuItem,
  MenuItems,
  MenuCheckboxItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSearch,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuSwitchItem,
  MenuTrigger,
  MenuUserCard,
}
