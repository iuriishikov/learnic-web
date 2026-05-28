"use client"

import * as React from "react"

export type UseCommandMenuOptions = {
  /** Letter pressed together with ⌘/Ctrl to toggle the menu. Default `"k"`. */
  shortcutKey?: string
  /** Also open on a bare `/` keypress while not typing in a field. Default `false`. */
  openOnSlash?: boolean
  /** Whether the menu starts open. Default `false`. */
  defaultOpen?: boolean
  /** Skip registering the global hotkey listener. Default `false`. */
  disabled?: boolean
}

export type UseCommandMenuReturn = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  openMenu: () => void
  closeMenu: () => void
  toggle: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el?.isContentEditable === true
  )
}

/**
 * Owns the open state of a command palette and wires its global shortcut
 * (⌘/Ctrl + K by default, optionally a bare `/`). A single scoped `keydown`
 * listener — matching the codebase pattern for surface shortcuts — rather than
 * a heavier hotkey library. `Esc`-to-close is handled by the Dialog itself.
 */
export function useCommandMenu({
  shortcutKey = "k",
  openOnSlash = false,
  defaultOpen = false,
  disabled = false,
}: UseCommandMenuOptions = {}): UseCommandMenuReturn {
  const [open, setOpen] = React.useState(defaultOpen)

  const openMenu = React.useCallback(() => setOpen(true), [])
  const closeMenu = React.useCallback(() => setOpen(false), [])
  const toggle = React.useCallback(() => setOpen((prev) => !prev), [])

  React.useEffect(() => {
    if (disabled) return
    const key = shortcutKey.toLowerCase()

    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey

      if (meta && event.key.toLowerCase() === key) {
        event.preventDefault()
        toggle()
        return
      }

      if (
        openOnSlash &&
        event.key === "/" &&
        !meta &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault()
        openMenu()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [disabled, shortcutKey, openOnSlash, toggle, openMenu])

  return { open, setOpen, openMenu, closeMenu, toggle }
}
