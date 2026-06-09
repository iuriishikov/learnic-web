'use client';

import { useCallback, useEffect, useRef } from 'react';

type UseDebouncedFlushOptions<T> = {
  /**
   * Identity of the thing being edited (block id, row id). Pending writes are
   * flushed when it changes — the editor instance is being reused for another
   * entity. Omit when the consuming component remounts per entity instead.
   */
  key?: string;
  /**
   * Last server-confirmed value. Pending writes equal to it (per `equals`)
   * are dropped instead of re-sent.
   */
  serverValue: T;
  /** Commits a value to the server (mutation, server action, …). */
  onChange: (value: T) => void;
  delayMs: number;
  /** Equality used for the redundant-write check. Defaults to `Object.is`. */
  equals?: (a: T, b: T) => boolean;
};

/**
 * Buffer high-frequency edits and commit them at most once per `delayMs`.
 * Pending writes are flushed on unmount and on `key` change, so the last
 * keystroke always reaches the server — even when the user immediately
 * switches blocks, closes the surface, or blurs the field.
 *
 * Not to be confused with `useDebouncedValue`, which debounces a *value for
 * rendering*; this debounces a *commit callback*.
 */
export function useDebouncedFlush<T>({
  key,
  serverValue,
  onChange,
  delayMs,
  equals,
}: UseDebouncedFlushOptions<T>): {
  /** Debounced setter — call on every edit. */
  schedule: (next: T) => void;
  /** Commit any pending write immediately (e.g. on blur). */
  flush: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Boxed so `T` may itself include `null` without colliding with "no pending".
  const pendingRef = useRef<{ value: T } | null>(null);
  const onChangeRef = useRef(onChange);
  const serverValueRef = useRef(serverValue);
  const equalsRef = useRef(equals);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    serverValueRef.current = serverValue;
  }, [serverValue]);

  useEffect(() => {
    equalsRef.current = equals;
  }, [equals]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending === null) return;
    const isEqual = equalsRef.current ?? Object.is;
    if (!isEqual(pending.value, serverValueRef.current)) {
      onChangeRef.current(pending.value);
    }
  }, []);

  // Flush pending writes whenever the edited entity changes (or on unmount):
  // a debounced edit on the previous entity must reach the server before the
  // editor is reused for another id.
  useEffect(() => {
    return flush;
  }, [key, flush]);

  const schedule = useCallback(
    (next: T) => {
      pendingRef.current = { value: next };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  return { schedule, flush };
}
