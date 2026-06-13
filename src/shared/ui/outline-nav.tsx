'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';

export type OutlineNavItem = {
  /**
   * Stable identifier. Also used as the anchor target id (`#id`) when
   * `scrollSpy` / `scrollOnSelect` are enabled.
   */
  id: string;
  label: React.ReactNode;
  /** Nested sub-items, to any depth. */
  children?: OutlineNavItem[];
  disabled?: boolean;
};

export type OutlineNavProps = {
  items: OutlineNavItem[];
  /** Accessible name for the `<nav>` landmark. */
  ariaLabel: string;
  /**
   * Controlled active id (e.g. the current lesson / route). When set it
   * always wins over the internal scroll-spy state.
   */
  activeId?: string;
  /**
   * Derive the active item from the scroll position of the `#id` elements
   * on the page (in-page tables of contents).
   */
  scrollSpy?: boolean;
  /**
   * `rootMargin` for the scroll-spy observer. The default leaves a band
   * just below a ~96px sticky header; widen the top inset for taller ones.
   */
  scrollSpyRootMargin?: string;
  /**
   * Smooth-scroll to `#id` when an item is selected. Defaults to whatever
   * `scrollSpy` is — turn it off for route-driven navigation.
   */
  scrollOnSelect?: boolean;
  /** Let items with children collapse. The active branch auto-expands. */
  collapsible?: boolean;
  /** Ids expanded on first render. Defaults to every parent (all open). */
  defaultExpandedIds?: string[];
  /** Fired on every item activation, with the item id and node. */
  onSelect?: (id: string, item: OutlineNavItem) => void;
  className?: string;
};

/**
 * Hierarchical outline navigation: a vertical rail of (optionally nested,
 * optionally collapsible) items with an active highlight. Drives two
 * shapes from one component —
 *
 * - **In-page table of contents** (`scrollSpy`): the active item follows
 *   the scroll position of the matching `#id` headings, and selecting one
 *   smooth-scrolls to it.
 * - **Controlled tree** (`activeId` + `collapsible`): e.g. modules → lessons,
 *   where the parent owns the active state and `onSelect` drives routing.
 *
 * Generic and business-logic-free — labels, data and selection handling
 * all come from the consumer.
 */
export function OutlineNav({
  items,
  ariaLabel,
  activeId: controlledActiveId,
  scrollSpy = false,
  scrollSpyRootMargin = '-96px 0px -70% 0px',
  scrollOnSelect,
  collapsible = false,
  defaultExpandedIds,
  onSelect,
  className,
}: OutlineNavProps) {
  const allIds = useMemo(() => collectIds(items), [items]);
  const parentIds = useMemo(() => collectParentIds(items), [items]);

  const [spyActiveId, setSpyActiveId] = useState<string | null>(null);
  const activeId = controlledActiveId ?? spyActiveId;
  const shouldScrollOnSelect = scrollOnSelect ?? scrollSpy;

  // Scroll-spy: highlight the first section still on screen.
  useEffect(() => {
    if (!scrollSpy || typeof IntersectionObserver === 'undefined') return;
    const elements = allIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = elements.find((element) => visible.has(element.id));
        if (first) setSpyActiveId(first.id);
      },
      { rootMargin: scrollSpyRootMargin, threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [scrollSpy, allIds, scrollSpyRootMargin]);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? parentIds),
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Force the active item's ancestors open so the highlight is always
  // reachable. Derived during render (not synced via an effect) to avoid
  // cascading re-renders; a manual collapse of the active branch simply
  // can't hide the active item.
  const activeAncestors = useMemo(
    () => (collapsible && activeId ? findAncestorIds(items, activeId) : []),
    [collapsible, activeId, items],
  );
  const effectiveExpanded = useMemo(() => {
    if (activeAncestors.length === 0) return expanded;
    const next = new Set(expanded);
    activeAncestors.forEach((id) => next.add(id));
    return next;
  }, [expanded, activeAncestors]);

  const handleSelect = useCallback(
    (item: OutlineNavItem) => {
      if (item.disabled) return;
      if (collapsible && item.children?.length) toggleExpanded(item.id);
      onSelect?.(item.id, item);
      if (shouldScrollOnSelect) {
        if (controlledActiveId === undefined) setSpyActiveId(item.id);
        window.history.replaceState(null, '', `#${item.id}`);
        scrollToAnchor(item.id);
      }
    },
    [
      collapsible,
      toggleExpanded,
      onSelect,
      shouldScrollOnSelect,
      controlledActiveId,
    ],
  );

  const context: RowContext = {
    activeId,
    collapsible,
    expanded: effectiveExpanded,
    onSelect: handleSelect,
  };

  return (
    <nav aria-label={ariaLabel} className={cn('text-sm', className)}>
      <NavList items={items} depth={0} context={context} />
    </nav>
  );
}

type RowContext = {
  activeId: string | null;
  collapsible: boolean;
  expanded: Set<string>;
  onSelect: (item: OutlineNavItem) => void;
};

function NavList({
  items,
  depth,
  context,
}: {
  items: OutlineNavItem[];
  depth: number;
  context: RowContext;
}) {
  return (
    <ul className={cn('flex flex-col', depth === 0 && 'border-l border-border')}>
      {items.map((item) => (
        <NavRow key={item.id} item={item} depth={depth} context={context} />
      ))}
    </ul>
  );
}

function NavRow({
  item,
  depth,
  context,
}: {
  item: OutlineNavItem;
  depth: number;
  context: RowContext;
}) {
  const hasChildren = Boolean(item.children?.length);
  const isExpanded = context.expanded.has(item.id);
  const isActive = context.activeId === item.id;
  const showToggle = context.collapsible && hasChildren;
  const childrenVisible = hasChildren && (!context.collapsible || isExpanded);

  return (
    <li>
      <button
        type="button"
        disabled={item.disabled}
        aria-current={isActive ? 'location' : undefined}
        aria-expanded={showToggle ? isExpanded : undefined}
        onClick={() => context.onSelect(item)}
        className={cn(
          '-ml-px flex w-full items-center gap-1.5 border-l-2 py-1.5 pr-2 text-left leading-snug transition-colors',
          isActive
            ? 'border-brand font-medium text-foreground'
            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          item.disabled && 'pointer-events-none opacity-50',
        )}
        // Depth-based indentation is dynamic, so it stays inline.
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
      >
        {showToggle ? (
          <ChevronRightIcon
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-90',
            )}
            aria-hidden
          />
        ) : context.collapsible ? (
          // Reserve the chevron's width so labels stay aligned within a level.
          <span className="size-3.5 shrink-0" aria-hidden />
        ) : null}
        <span className="min-w-0 flex-1">{item.label}</span>
      </button>
      {childrenVisible ? (
        <NavList items={item.children!} depth={depth + 1} context={context} />
      ) : null}
    </li>
  );
}

function scrollToAnchor(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}

function collectIds(items: OutlineNavItem[]): string[] {
  const ids: string[] = [];
  const walk = (nodes: OutlineNavItem[]) => {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children) walk(node.children);
    }
  };
  walk(items);
  return ids;
}

function collectParentIds(items: OutlineNavItem[]): string[] {
  const ids: string[] = [];
  const walk = (nodes: OutlineNavItem[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(items);
  return ids;
}

function findAncestorIds(items: OutlineNavItem[], targetId: string): string[] {
  const path: string[] = [];
  const dfs = (nodes: OutlineNavItem[], trail: string[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.push(...trail);
        return true;
      }
      if (node.children && dfs(node.children, [...trail, node.id])) return true;
    }
    return false;
  };
  dfs(items, []);
  return path;
}
