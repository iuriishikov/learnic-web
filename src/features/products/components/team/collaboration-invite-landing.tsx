'use client';

import {
  CheckCircle2Icon,
  Loader2Icon,
  LogInIcon,
  XCircleIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import {
  acceptCollaborationInviteByTokenAction,
  type AcceptCollaborationInviteOutcome,
} from '../../api/collaboration-invite';

type Status =
  | 'pending'
  | 'success'
  | 'needsLogin'
  | 'forbidden'
  | 'expired'
  | 'unavailable'
  | 'network';

type CollaborationInviteLandingProps = {
  productId: string;
  collaborationId: string;
  /** Plaintext token from the email link; null if the link was malformed. */
  token: string | null;
};

type ViewModel = {
  tone: 'brand' | 'muted' | 'destructive';
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Map the action's outcome to a terminal screen. `unauthorized` becomes
 * `needsLogin` rather than a dead end — the server gate redirects anonymous
 * visitors to `/login` first, so a 401 here means the cookie lapsed
 * mid-flight and the user just needs to re-authenticate. Exhaustive over
 * every reason the action can return.
 */
function statusFromOutcome(outcome: AcceptCollaborationInviteOutcome): Status {
  if (outcome.ok) return 'success';
  switch (outcome.reason) {
    case 'network':
      return 'network';
    case 'expired':
      return 'expired';
    case 'unauthorized':
      return 'needsLogin';
    case 'forbidden':
      return 'forbidden';
    case 'not-found':
    case 'unavailable':
    case 'unknown':
      return 'unavailable';
  }
}

/**
 * Email-link landing for a collaboration invite. Fires
 * `POST /collaborations/{id}/accept-by-token` exactly once on mount and
 * renders the outcome. Because the POST lives in a client effect, email
 * prefetchers (Outlook SafeLinks, antivirus scanners, link unfurlers)
 * can't silently consume the invite — they don't run React effects. The
 * `firedRef` guard also absorbs React StrictMode's double-effect.
 */
export function CollaborationInviteLanding({
  productId,
  collaborationId,
  token,
}: CollaborationInviteLandingProps) {
  const t = useTranslations('collaboration-invite');
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>(
    token ? 'pending' : 'unavailable',
  );
  const firedRef = useRef(false);
  const aliveRef = useRef(true);

  const runAccept = useCallback(async () => {
    if (!token) {
      setStatus('unavailable');
      return;
    }
    setStatus('pending');
    const outcome = await acceptCollaborationInviteByTokenAction({
      collaborationId,
      token,
    });
    if (!aliveRef.current) return;
    setStatus(statusFromOutcome(outcome));
  }, [collaborationId, token]);

  useEffect(() => {
    aliveRef.current = true;
    if (!firedRef.current) {
      firedRef.current = true;
      void runAccept();
    }
    return () => {
      aliveRef.current = false;
    };
  }, [runAccept]);

  const view: ViewModel = (() => {
    switch (status) {
      case 'pending':
        return {
          tone: 'brand',
          icon: (
            <Loader2Icon className="size-6 animate-spin text-brand" aria-hidden />
          ),
          title: t('pending.title'),
          description: t('pending.description'),
        };
      case 'success':
        return {
          tone: 'brand',
          icon: <CheckCircle2Icon className="size-6 text-brand" aria-hidden />,
          title: t('success.title'),
          description: t('success.description'),
          action: (
            <Button
              className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
              render={<Link href={`/products/${productId}`} />}
              nativeButton={false}
            >
              {t('success.continue')}
            </Button>
          ),
        };
      case 'needsLogin': {
        const target = `/products/${productId}/collaboration-invitation/${collaborationId}/accept${
          token ? `?token=${encodeURIComponent(token)}` : ''
        }`;
        return {
          tone: 'muted',
          icon: <LogInIcon className="size-6 text-muted-foreground" aria-hidden />,
          title: t('needsLogin.title'),
          description: t('needsLogin.description'),
          action: (
            <Button
              className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
              render={<Link href={`/login?from=${encodeURIComponent(target)}`} />}
              nativeButton={false}
            >
              {t('needsLogin.login')}
            </Button>
          ),
        };
      }
      case 'forbidden':
        return {
          tone: 'destructive',
          icon: <XCircleIcon className="size-6 text-destructive" aria-hidden />,
          title: t('forbidden.title'),
          description: t('forbidden.description'),
        };
      case 'expired':
        return {
          tone: 'destructive',
          icon: <XCircleIcon className="size-6 text-destructive" aria-hidden />,
          title: t('expired.title'),
          description: t('expired.description'),
        };
      case 'network':
        return {
          tone: 'destructive',
          icon: <XCircleIcon className="size-6 text-destructive" aria-hidden />,
          title: t('network.title'),
          description: t('network.description'),
          action: (
            <Button
              variant="outline"
              className="h-11 w-full rounded-lg text-[15px] font-semibold"
              onClick={() => {
                void runAccept();
              }}
            >
              {t('network.retry')}
            </Button>
          ),
        };
      case 'unavailable':
        return {
          tone: 'destructive',
          icon: <XCircleIcon className="size-6 text-destructive" aria-hidden />,
          title: t('unavailable.title'),
          description: t('unavailable.description'),
        };
    }
  })();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={status}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col items-start gap-4"
      >
        <div
          className={
            view.tone === 'brand'
              ? 'flex size-12 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/15'
              : 'flex size-12 items-center justify-center rounded-full bg-muted'
          }
        >
          {view.icon}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">{view.title}</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {view.description}
          </p>
        </div>
        {view.action ? <div className="mt-2 w-full">{view.action}</div> : null}
      </motion.div>
    </AnimatePresence>
  );
}
