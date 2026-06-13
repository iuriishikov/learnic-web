'use client';

import { CookieIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { Banner } from '@/shared/ui/banner';

const ACCEPT_KEY = 'learnic.cookie-consent.accepted-at';
const BANNER_ID = 'cookie-consent';
// Above the Web Push nudge (priority 10) so the cookie notice always wins
// the single banner slot until the visitor accepts it.
const BANNER_PRIORITY = 100;

/**
 * Site-wide cookie-consent notice.
 *
 * Rendered through the shared :class:`Banner` queue (mounted in the
 * root locale layout) so it shows for every visitor — anonymous and
 * authenticated alike — and competes with other site-level prompts in
 * one slot. The notice is informational: the site only sets strictly
 * necessary cookies (authentication + the ``NEXT_LOCALE`` preference),
 * so there is a single "Accept" action and no opt-out — declining is
 * not offered because none of the cookies are optional.
 *
 * Acceptance is stored in ``localStorage`` and mirrored across tabs via
 * a synthetic ``storage`` event, matching the Web Push banner. Once
 * accepted, the component returns ``null`` and the queue removes its
 * entry on unmount.
 */
export function CookieConsentBanner() {
  const t = useTranslations('cookie-consent');
  const acceptedFromStorage = useSyncExternalStore(
    subscribeToAcceptStorage,
    readAcceptedSnapshot,
    readAcceptedServerSnapshot,
  );
  const [accepted, setAccepted] = useState(false);

  if (accepted || acceptedFromStorage) return null;

  function handleAccept() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACCEPT_KEY, String(Date.now()));
        // Notify other tabs / banner instances so they re-read storage.
        window.dispatchEvent(new StorageEvent('storage', { key: ACCEPT_KEY }));
      } catch {
        // localStorage can throw in private mode — fall back to in-memory.
      }
    }
    setAccepted(true);
  }

  const description = t.rich('body', {
    link: (chunks) => (
      <Link
        href="/privacy"
        className="font-medium text-brand underline-offset-2 hover:underline"
      >
        {chunks}
      </Link>
    ),
  });

  return (
    <Banner
      id={BANNER_ID}
      priority={BANNER_PRIORITY}
      variant="plain"
      layout="auto"
      position="bottom"
      icon={<CookieIcon className="size-5 shrink-0 text-brand" aria-hidden />}
      title={t('title')}
      description={description}
      primaryAction={{ label: t('accept'), onClick: handleAccept }}
      dismissable={false}
    />
  );
}

function readAcceptedSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(ACCEPT_KEY) !== null;
  } catch {
    return false;
  }
}

function readAcceptedServerSnapshot(): boolean {
  // Hide on the server snapshot until hydration; the client snapshot
  // drives the actual decision after mount (avoids a flash + hydration
  // mismatch for visitors who have already accepted).
  return true;
}

function subscribeToAcceptStorage(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  function handle(event: StorageEvent) {
    if (event.key === null || event.key === ACCEPT_KEY) onChange();
  }
  window.addEventListener('storage', handle);
  return () => window.removeEventListener('storage', handle);
}
