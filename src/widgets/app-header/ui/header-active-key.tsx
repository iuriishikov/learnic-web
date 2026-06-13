'use client';

import { useEffect } from 'react';

import {
  type HeaderActiveKey as HeaderActiveKeyValue,
  useSetHeaderActiveKey,
} from './header-config-provider';

type HeaderActiveKeyProps = {
  /**
   * `null` → no nav tab is active while this is mounted (e.g. the note
   * reader); a key string → force that tab active. Resets to pathname-based
   * matching on unmount.
   */
  value: HeaderActiveKeyValue;
};

/**
 * Overrides which top-nav tab reads as active for the current route. Mount it
 * on pages whose pathname would otherwise match the wrong tab — e.g. the
 * public note reader at `/products/{id}`, which shares the `/products` prefix
 * owned by the «Преподавать» tab but is not a teaching page.
 */
export function HeaderActiveKey({ value }: HeaderActiveKeyProps) {
  const setActiveKey = useSetHeaderActiveKey();
  useEffect(() => {
    setActiveKey(value);
    return () => setActiveKey(undefined);
  }, [value, setActiveKey]);
  return null;
}
