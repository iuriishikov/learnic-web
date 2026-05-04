'use client';

import { useEffect, useMemo } from 'react';

/**
 * Create a managed object URL for a `File` or `Blob`. The URL is revoked on
 * unmount and whenever the input changes — safe to use as an `<img>` `src`
 * or as a CSS `background-image`. Returns `null` for empty inputs and during
 * SSR.
 */
export function useObjectUrl(
  file: File | Blob | null | undefined,
): string | null {
  const url = useMemo(() => {
    if (!file || typeof window === 'undefined') return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}
