export type NavActiveItem = {
  key: string;
  href: string;
  /**
   * Optional override for the default longest-prefix rule. When set, this
   * predicate alone decides whether the item is active for `pathname` — use it
   * for a tab whose `href` prefix is shared by an unrelated surface (e.g.
   * `/products` owns the teaching studio, but the public note reader also lives
   * at `/products/[id]` and must not light the teach tab). Tie-breaking still
   * uses `href.length`, so a more specific tab wins over a less specific one.
   */
  isActivePath?: (pathname: string) => boolean;
};

/**
 * Resolve which nav item is active for the current `pathname` by longest
 * matching `href`. An item with an `isActivePath` predicate uses that instead
 * of the default `href`-prefix rule. Returns the matching item's `key`, or
 * `undefined` when nothing matches.
 *
 * `pathname` is expected to be locale-stripped (next-intl's `usePathname`
 * already removes the `/ru` | `/en` prefix), so hrefs are compared as-is.
 */
export function resolveActiveNavKey(
  items: NavActiveItem[],
  pathname: string,
): string | undefined {
  let bestKey: string | undefined;
  let bestLength = -1;

  for (const item of items) {
    const isRoot = item.href === '/';
    // `/` is special-cased to a weight of 1 so it only ever wins on an exact
    // root match — every other href outranks it by length.
    const weight = isRoot ? 1 : item.href.length;
    if (weight <= bestLength) continue;

    const active = item.isActivePath
      ? item.isActivePath(pathname)
      : isRoot
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (active) {
      bestKey = item.key;
      bestLength = weight;
    }
  }

  return bestKey;
}
