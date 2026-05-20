'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import {
  CollaborationCursor,
  type CollabUser,
} from '@/shared/ui/collaboration-cursor';

import type { CursorEntry } from '../model/types';
import { useCursorsContext } from './cursors-provider';

/**
 * Resolver a consumer passes in to map a userId → a renderable
 * `CollabUser` (name + accent color + optional avatar). Returns
 * `null` if the user is unknown — the layer falls back to a
 * placeholder so unknown collaborators still render with an
 * "anonymous" cursor instead of disappearing.
 */
export type ResolveCursorUser = (userId: string) => CollabUser | null;

type EditorCursorsLayerProps = {
  resolveUser: ResolveCursorUser;
  /** Stacking order of the cursors portal layer. */
  zIndex?: number;
};

/**
 * Renders one `<CollaborationCursor>` PER USER (keyed by userId).
 *
 * Critically, keying by userId rather than fieldKey keeps the same
 * component instance mounted while a user hops between fields —
 * `CollaborationCursor` then sees a `target` prop change and runs
 * its spring animation across the gap. Keying by fieldKey would
 * unmount the old binding and mount a new one, producing a hard
 * pop-in instead of a smooth glide.
 *
 * The DOM lookup for each user's current target is delegated to
 * `UserCursorBinding`, which subscribes only to that user's entry
 * — a quiet user does not re-render when somebody else moves.
 */
export function EditorCursorsLayer({
  resolveUser,
  zIndex = 60,
}: EditorCursorsLayerProps) {
  const ctx = useCursorsContext();
  const t = useTranslations('cursors-presence');

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!ctx) return () => {};
      return ctx.store.subscribeAny(listener);
    },
    [ctx],
  );
  const getSnapshot = React.useCallback(() => {
    if (!ctx) return EMPTY_USERS;
    return ctx.store.getActiveUserIds();
  }, [ctx]);
  const getServerSnapshot = React.useCallback(() => EMPTY_USERS, []);

  const activeUserIds = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!ctx || activeUserIds.length === 0) return null;

  return (
    <>
      {activeUserIds.map((userId) => (
        <UserCursorBinding
          key={userId}
          userId={userId}
          resolveUser={resolveUser}
          translate={t}
          zIndex={zIndex}
        />
      ))}
    </>
  );
}

const EMPTY_USERS: readonly string[] = Object.freeze([]);

type UserCursorBindingProps = {
  userId: string;
  resolveUser: ResolveCursorUser;
  translate: (key: string) => string;
  zIndex: number;
};

function UserCursorBinding({
  userId,
  resolveUser,
  translate,
  zIndex,
}: UserCursorBindingProps) {
  const ctx = useCursorsContext();

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!ctx) return () => {};
      return ctx.store.subscribeUser(userId, listener);
    },
    [ctx, userId],
  );
  const getSnapshot = React.useCallback(() => {
    if (!ctx) return null;
    return ctx.store.getEntryForUser(userId);
  }, [ctx, userId]);
  const getServerSnapshot = React.useCallback(() => null, []);
  const entry = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Resolve the DOM target inline. querySelector during render is
  // cheap and the editor's DOM is committed by the time this binding
  // fires. The cursor's own ResizeObserver+scroll listener handles
  // in-place repositioning at 60fps via motion values.
  const target = React.useMemo<HTMLElement | null>(() => {
    if (typeof document === 'undefined' || !entry) return null;
    return document.querySelector<HTMLElement>(
      `[data-cursor-target="${cssEscape(entry.fieldKey)}"]`,
    );
  }, [entry]);

  const users = React.useMemo<CollabUser[]>(() => {
    if (!entry) return EMPTY_RESOLVED;
    const built = buildUser(entry, resolveUser, translate);
    return built ? [built] : EMPTY_RESOLVED;
  }, [entry, resolveUser, translate]);

  if (!entry || !target || users.length === 0) return null;
  return <CollaborationCursor target={target} users={users} zIndex={zIndex} />;
}

const EMPTY_RESOLVED: CollabUser[] = [];

function buildUser(
  entry: CursorEntry,
  resolveUser: ResolveCursorUser,
  translate: (key: string) => string,
): CollabUser | null {
  const resolved = resolveUser(entry.userId);
  const status = entry.action
    ? translateAction(entry.action, translate)
    : undefined;
  if (resolved) {
    return { ...resolved, status };
  }
  // Fallback for users not in the collaborators list (e.g. the
  // product owner who shows up in cursor events but isn't in the
  // collaborations REST cache). Renders as an anonymous cursor.
  return {
    id: entry.userId,
    name: translate('fallback.unknownUser'),
    status,
  };
}

function translateAction(
  action: string,
  translate: (key: string) => string,
): string {
  const key = `actions.${action}`;
  try {
    const localized = translate(key);
    if (localized && localized !== key) return localized;
  } catch {
    // next-intl throws on missing keys when in strict mode; fall
    // through to the raw action label.
  }
  return action;
}

/** Minimal CSS.escape delegate — every supported browser has it. */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}
