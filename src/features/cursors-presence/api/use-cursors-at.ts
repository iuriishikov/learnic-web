'use client';

import * as React from 'react';

import { useCursorsContext } from '../components/cursors-provider';
import type { CursorEntry, FieldKey } from '../model/types';

/**
 * Subscribe to the list of cursor entries currently at `fieldKey`.
 * Returns the same array reference until either membership or any
 * entry's `action` actually changes — so consumers can compare by
 * `===` and avoid re-rendering on heartbeats.
 *
 * Returns an empty array when the provider isn't mounted — the hook
 * is safe to call outside of `<CursorsProvider>` (the editor uses
 * the same components across surfaces; not all of them are inside a
 * provider).
 */
export function useCursorsAt(fieldKey: FieldKey): readonly CursorEntry[] {
  const ctx = useCursorsContext();
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!ctx) return () => {};
      return ctx.store.subscribeField(fieldKey, listener);
    },
    [ctx, fieldKey],
  );
  const getSnapshot = React.useCallback(() => {
    if (!ctx) return EMPTY;
    return ctx.store.getEntriesAt(fieldKey);
  }, [ctx, fieldKey]);
  const getServerSnapshot = React.useCallback(() => EMPTY, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const EMPTY: readonly CursorEntry[] = Object.freeze([]);
