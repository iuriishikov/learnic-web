'use client';

import * as React from 'react';

import { useCursorsContext } from '../components/cursors-provider';
import type { CursorAction, FieldKey } from '../model/types';

/**
 * Escape-hatch for callers that need to publish cursor presence
 * outside of focus-driven semantics (e.g. "I'm viewing this
 * section" while reading a long page). Most consumers should just
 * slap `data-cursor-target` on the focusable element and let the
 * provider's auto-publish layer handle it.
 *
 * Outside of a `<CursorsProvider>` both methods are no-ops.
 */
export function useCursorsPublisher(): {
  enter: (fieldKey: FieldKey, action?: CursorAction) => void;
  leave: (fieldKey: FieldKey) => void;
} {
  const ctx = useCursorsContext();
  return React.useMemo(
    () => ({
      enter: (fieldKey, action) => {
        ctx?.publishEnter(fieldKey, action);
      },
      leave: (fieldKey) => {
        ctx?.publishLeave(fieldKey);
      },
    }),
    [ctx],
  );
}
