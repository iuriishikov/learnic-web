import * as React from 'react';

const HOVER_QUERY = '(hover: hover)';

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(HOVER_QUERY);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(HOVER_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Whether the primary input can hover (`@media (hover: hover)`).
 *
 * Resolves to `false` on the server and the hydration pass, so touch
 * devices never mount hover-only chrome (hover previews, peek cards);
 * hover-capable clients upgrade immediately after hydration.
 */
export function useHasHover() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
