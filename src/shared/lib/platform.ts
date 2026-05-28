"use client"

import * as React from "react"

/**
 * Platform detection for keyboard-shortcut hints. macOS renders the Command
 * symbol (⌘); everything else renders "Ctrl". Detect once and reuse — never
 * hardcode `Ctrl` on macOS or `⌘` on Windows in tooltips / palette hints.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false
  // `userAgentData` is the modern signal; fall back to platform/userAgent.
  const platform =
    (
      navigator as Navigator & {
        userAgentData?: { platform?: string }
      }
    ).userAgentData?.platform ??
    navigator.platform ??
    navigator.userAgent ??
    ""
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** The primary modifier symbol for the current platform: ⌘ on macOS, Ctrl elsewhere. */
export function modifierSymbol(mac: boolean): string {
  return mac ? "⌘" : "Ctrl"
}

const noopSubscribe = () => () => {}

/**
 * Client hook returning whether the current platform is macOS. Backed by
 * `useSyncExternalStore` so it's SSR-safe: the server snapshot defaults to
 * `true` (the common ⌘ hint), and non-mac clients flip to "Ctrl" after
 * hydration without a mismatch warning.
 */
export function useIsMac(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => isMac(),
    () => true,
  )
}
