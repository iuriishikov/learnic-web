'use client';

import {
  CheckCircle2Icon,
  GiftIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import { acceptGiftByTokenAction, declineGiftAction } from '../api/resolve';
import type { Gift, GiftAction } from '../model/types';

type Status =
  | 'idle'
  | 'pending'
  | 'success'
  | 'declined'
  | 'unavailable'
  | 'expired'
  | 'network';

type GiftLandingProps = {
  gift: Gift;
  action: GiftAction;
  /** Present for the accept-by-token flow; absent for in-app decline. */
  token: string | null;
};

const NOTE_HREF = '/marketplace';

/**
 * Derive the initial landing state from the gift's live status, so a
 * recipient who already resolved the gift (or whose link expired) sees
 * the right terminal screen without having to press a button. Exhaustive
 * over GiftStatus.
 */
function deriveInitialStatus(gift: Gift): Status {
  switch (gift.status) {
    case 'accepted':
      return 'success';
    case 'declined':
      return 'declined';
    case 'revoked':
      return 'unavailable';
    case 'pending_invite': {
      if (
        gift.inviteExpiresAt !== null &&
        new Date(gift.inviteExpiresAt).getTime() <= Date.now()
      ) {
        return 'expired';
      }
      return 'idle';
    }
  }
}

export function GiftLanding({ gift, action, token }: GiftLandingProps) {
  const t = useTranslations('gifts');
  const router = useRouter();
  const initial = useMemo(() => deriveInitialStatus(gift), [gift]);
  const [status, setStatus] = useState<Status>(initial);
  const [isNavigating, startNavigating] = useTransition();

  const gifterName = gift.gifter.fullName.trim() || gift.gifter.email;
  // On accept the recipient is enrolled, so we send them straight to the
  // product reader. The catalogue stays the destination only for the
  // decline path (nothing to read).
  const productHref = `/products/${gift.productId}`;

  async function handleConfirm() {
    if (status !== 'idle') return;
    setStatus('pending');

    if (action === 'accept') {
      if (!token) {
        // Accept requires the signed token from the email link.
        setStatus('unavailable');
        return;
      }
      const result = await acceptGiftByTokenAction({ giftId: gift.id, token });
      if (result.ok) {
        setStatus('success');
        startNavigating(() => router.push(productHref));
        return;
      }
      mapFailure(result.reason);
      return;
    }

    const result = await declineGiftAction({ giftId: gift.id });
    if (result.ok) {
      setStatus('declined');
      return;
    }
    mapFailure(result.reason);
  }

  function mapFailure(
    reason:
      | 'unauthorized'
      | 'forbidden'
      | 'not-found'
      | 'expired'
      | 'unavailable'
      | 'network'
      | 'unknown',
  ) {
    switch (reason) {
      case 'network':
        setStatus('network');
        return;
      case 'expired':
        setStatus('expired');
        return;
      // forbidden (email/account mismatch), not-found, unauthorized,
      // unavailable (gift moved on), unknown → a single "no longer
      // available" terminal. Every variant handled explicitly.
      case 'forbidden':
      case 'not-found':
      case 'unauthorized':
      case 'unavailable':
      case 'unknown':
        setStatus('unavailable');
        return;
    }
  }

  /* ----------------------------- terminal states ----------------------- */

  if (status === 'success') {
    return (
      <ResultBlock
        tone="success"
        icon={<CheckCircle2Icon className="size-8 text-brand" aria-hidden />}
        title={t('success.title')}
        description={t('success.description', { product: gift.productName })}
        action={
          <Button
            className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
            onClick={() => router.push(productHref)}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t('success.continue')}
          </Button>
        }
      />
    );
  }

  if (status === 'declined') {
    return (
      <ResultBlock
        tone="muted"
        icon={
          <XCircleIcon className="size-8 text-muted-foreground" aria-hidden />
        }
        title={t('declined.title')}
        description={t('declined.description', { product: gift.productName })}
        action={
          <Button
            variant="outline"
            className="h-11 w-full rounded-lg text-[15px] font-semibold"
            render={<Link href={NOTE_HREF} />}
            nativeButton={false}
          >
            {t('declined.browse')}
          </Button>
        }
      />
    );
  }

  if (status === 'expired') {
    return (
      <ResultBlock
        tone="destructive"
        icon={<XCircleIcon className="size-8 text-destructive" aria-hidden />}
        title={t('expired.title')}
        description={t('expired.description')}
      />
    );
  }

  if (status === 'unavailable') {
    return (
      <ResultBlock
        tone="destructive"
        icon={<XCircleIcon className="size-8 text-destructive" aria-hidden />}
        title={t('unavailable.title')}
        description={t('unavailable.description')}
      />
    );
  }

  if (status === 'network') {
    return (
      <ResultBlock
        tone="destructive"
        icon={<XCircleIcon className="size-8 text-destructive" aria-hidden />}
        title={t('network.title')}
        description={t('network.description')}
        action={
          <Button
            variant="outline"
            className="h-11 w-full rounded-lg text-[15px] font-semibold"
            onClick={() => setStatus('idle')}
          >
            {t('network.retry')}
          </Button>
        }
      />
    );
  }

  /* ----------------------------- idle / pending ------------------------ */

  const pending = status === 'pending';
  const isAccept = action === 'accept';

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/15">
        <GiftIcon className="size-6 text-brand" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          {isAccept ? t('accept.title') : t('decline.title')}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {isAccept
            ? t('accept.description', {
                gifter: gifterName,
                product: gift.productName,
              })
            : t('decline.description', {
                gifter: gifterName,
                product: gift.productName,
              })}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2.5 sm:flex-row">
        <Button
          className={
            isAccept
              ? 'h-11 flex-1 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90'
              : 'h-11 flex-1 rounded-lg bg-destructive text-[15px] font-semibold text-white hover:bg-destructive/90'
          }
          onClick={handleConfirm}
          disabled={pending}
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : null}
          {isAccept
            ? pending
              ? t('accept.confirming')
              : t('accept.cta')
            : pending
              ? t('decline.confirming')
              : t('decline.cta')}
        </Button>
        <Button
          variant="ghost"
          className="h-11 rounded-lg text-[15px] font-semibold"
          render={
            <Link
              href={isAccept ? `/gifts/${gift.id}/decline` : `/gifts/${gift.id}/accept`}
            />
          }
          nativeButton={false}
          disabled={pending}
        >
          {isAccept ? t('accept.switchToDecline') : t('decline.switchToAccept')}
        </Button>
      </div>
    </div>
  );
}

function ResultBlock({
  icon,
  title,
  description,
  action,
}: {
  tone: 'success' | 'muted' | 'destructive';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-[15px] text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-2 w-full">{action}</div> : null}
    </div>
  );
}
