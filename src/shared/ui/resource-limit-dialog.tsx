'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import {
  ResourceLimitError,
  type ResourceLimitInfo,
} from '@/shared/api/resource-limit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

/* ---------- module-level store (mirrors banner.tsx) ---------- */

type DialogState = { info: ResourceLimitInfo | null; open: boolean };

const CLOSED: DialogState = { info: null, open: false };

let state: DialogState = CLOSED;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): DialogState {
  return CLOSED;
}

/**
 * Imperative trigger — callable from anywhere (any feature's mutation)
 * when the backend reports a `ResourceLimitReached` 409.
 */
export function showResourceLimit(info: ResourceLimitInfo) {
  state = { info, open: true };
  emit();
}

/**
 * Convenience for mutation call sites: pops the limit dialog when a
 * server action's failure result carries `resourceLimit` (parsed from
 * a backend `ResourceLimitReached` 409 via {@link readResourceLimit}).
 * Returns `true` when it handled the case so the caller can skip its
 * generic error toast.
 */
export function notifyResourceLimit(
  info: ResourceLimitInfo | null | undefined,
): boolean {
  if (info == null) return false;
  showResourceLimit(info);
  return true;
}

/**
 * For optimistic TanStack mutations whose `mutationFn` throws on
 * failure: pops the limit dialog and throws the typed
 * {@link ResourceLimitError} marker when a server-action result carries
 * `resourceLimit` (a `ResourceLimitReached` 409), so the mutation's
 * `onError` can skip its generic toast via `isResourceLimitError`. Any
 * other failure throws its plain reason string.
 */
export function failMutation(result: {
  reason: string;
  resourceLimit?: ResourceLimitInfo | null;
}): never {
  if (result.resourceLimit != null) {
    showResourceLimit(result.resourceLimit);
    throw new ResourceLimitError(result.resourceLimit);
  }
  throw new Error(result.reason);
}

function dismiss() {
  // Keep `info` so the limit number doesn't flash to 0 while the dialog
  // plays its close animation; only the `open` flag drives visibility.
  state = { info: state.info, open: false };
  emit();
}

/* ---------- host (mount once in the root layout) ---------- */

export function ResourceLimitDialogHost() {
  const { info, open } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const t = useTranslations('resource-limit');

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { limit: info?.limit ?? 0 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={dismiss}>
            {t('action')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
