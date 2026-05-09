'use client';

import { BellIcon, ShareIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';

import { useAuth } from '@/features/auth';
import { useNotify } from '@/shared/lib/notify';
import { Banner, type BannerAction } from '@/shared/ui/banner';

import { usePushSubscription } from '../hooks/use-push-subscription';

const DISMISS_KEY = 'learnic.push-banner.dismissed-at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BANNER_ID = 'push-permission';
const BANNER_PRIORITY = 10;

/**
 * Floating banner that nudges authenticated users to enable Web Push.
 *
 * Rendered through the shared :class:`Banner` queue so it competes
 * with cookie-consent and other site-level prompts in one slot. The
 * component returns ``null`` whenever no nudge is appropriate
 * (anonymous, already subscribed, recently dismissed, browser
 * unsupported); the queue cleans up the entry automatically when
 * the component unmounts.
 *
 * iOS Safari outside the standalone PWA shell switches the copy
 * to "Add to Home Screen" instructions; once the user has the app
 * installed, ``status`` flips to a normal ``unsubscribed`` and the
 * banner offers the standard subscribe CTA.
 */
export function PushBanner() {
  const t = useTranslations('web-push.banner');
  const { user } = useAuth();
  const { status, initializing, subscribe } = usePushSubscription();
  const notify = useNotify();
  const dismissedFromStorage = useSyncExternalStore(
    subscribeToDismissStorage,
    readDismissedSnapshot,
    readDismissedServerSnapshot,
  );
  const [manualDismiss, setManualDismiss] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  if (initializing) return null;
  if (manualDismiss || dismissedFromStorage) return null;
  if (status === 'subscribed' || status === 'unsupported') return null;

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        // Notify other tabs / banner instances so they re-read storage.
        window.dispatchEvent(new StorageEvent('storage', { key: DISMISS_KEY }));
      } catch {
        // localStorage can throw in private mode — fall back to in-memory dismissal.
      }
    }
    setManualDismiss(true);
  }

  async function handleEnable() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await subscribe();
      if (result.ok) {
        notify.success(t('enabled'));
        return;
      }
      if (result.error.kind === 'forbidden') {
        notify.error(t('errors.permissionDenied'));
      } else if (result.error.kind === 'notConfigured') {
        notify.error(t('errors.notConfigured'));
      } else {
        notify.error(t('errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  }

  const isIOSMode = status === 'pwa-required';
  const isDenied = status === 'permission-denied';

  const description = isIOSMode
    ? t('iosBody')
    : isDenied
      ? t('deniedBody')
      : t('body');

  const icon = isIOSMode ? (
    <ShareIcon className="size-5 shrink-0 text-brand" aria-hidden />
  ) : (
    <BellIcon className="size-5 shrink-0 text-brand" aria-hidden />
  );

  // No primary CTA for iOS / denied — there is no in-page action that
  // would resolve them; the banner just informs and lets the user
  // dismiss it. Normal browsers get "Enable" + "Not now".
  const primaryAction: BannerAction | undefined =
    isIOSMode || isDenied
      ? undefined
      : {
          label: busy ? t('enabling') : t('enable'),
          onClick: () => {
            void handleEnable();
          },
        };

  const secondaryAction: BannerAction | undefined = primaryAction
    ? { label: t('later'), onClick: handleDismiss }
    : undefined;

  return (
    <Banner
      id={BANNER_ID}
      priority={BANNER_PRIORITY}
      variant="plain"
      layout="auto"
      position="bottom"
      icon={icon}
      title={t('title')}
      description={description}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      dismissable
      closeLabel={t('aria.dismiss')}
      onDismiss={handleDismiss}
    />
  );
}

function readDismissedSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number.parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts <= DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function readDismissedServerSnapshot(): boolean {
  // Hide on the server snapshot until hydration; the client snapshot
  // drives the actual decision after mount.
  return true;
}

function subscribeToDismissStorage(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  function handle(event: StorageEvent) {
    if (event.key === null || event.key === DISMISS_KEY) onChange();
  }
  window.addEventListener('storage', handle);
  return () => window.removeEventListener('storage', handle);
}
