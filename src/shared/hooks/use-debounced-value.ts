'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `value` after `delayMs` of inactivity. Useful for piping a
 * fast-changing input (search query, slider) into a server fetch.
 *
 * Not to be confused with `useDebouncedFlush`, which debounces a *commit
 * callback* (with flush-on-unmount semantics); this debounces a *value
 * for rendering*.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
