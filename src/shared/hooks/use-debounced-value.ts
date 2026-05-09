'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `value` after `delayMs` of inactivity. Useful for piping a
 * fast-changing input (search query, slider) into a server fetch.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
