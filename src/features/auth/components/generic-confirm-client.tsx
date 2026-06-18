'use client';

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import { useAuth } from '@/shared/auth';
import { useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import { verifyTokenAction } from '../api/confirm';

type Status = 'pending' | 'success' | 'invalid' | 'network';

type GenericConfirmClientProps = {
  token?: string;
};

/**
 * Auto-consume confirmation client.
 *
 * Mounted by `/confirm/<purpose>` whenever the purpose is NOT in
 * `CONFIRM_REGISTRY`. Fires `POST /auth/verify-token` exactly once on
 * mount, then renders one of: pending / success / invalid / network.
 *
 * Strict client-side mount means email-link prefetchers (Outlook
 * SafeLinks, antivirus scanners, link unfurlers) cannot consume the
 * token — they don't execute React effects.
 *
 * Idempotent against React StrictMode double-effect via `firedRef`:
 * a second consume against an already-consumed token would otherwise
 * surface a misleading "invalid" alert on the second run.
 */
export function GenericConfirmClient({ token }: GenericConfirmClientProps) {
  const t = useTranslations('confirm.generic');
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'invalid');
  const [isContinuing, startContinue] = useTransition();
  const firedRef = useRef(false);

  // `/auth/verify-token` only marks the email verified — it does NOT
  // install auth cookies on this tab. For the signup flow the cookies
  // are installed out-of-band by the original "waiting" tab via
  // `/auth/email-verification/wait`, landing in the shared cookie jar.
  // So on "continue" we re-read the session (`refresh()` → `/auth/me`)
  // before navigating: if the cookie is now present the user lands home
  // already authenticated, otherwise on login. Without this re-read the
  // auth context keeps its server-seeded `null` user (the root layout
  // ran while still anonymous and a soft `<Link>` navigation never
  // re-runs it) until a full page reload — which is the bug this fixes.
  const handleContinue = () => {
    startContinue(async () => {
      const user = await refresh();
      router.push(user ? '/' : '/login');
    });
  };

  useEffect(() => {
    if (!token) return;
    if (firedRef.current) return;
    firedRef.current = true;

    let cancelled = false;
    (async () => {
      const result = await verifyTokenAction({ token });
      if (cancelled) return;
      if (result.ok) {
        setStatus('success');
        return;
      }
      setStatus(result.error.kind === 'network' ? 'network' : 'invalid');
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'pending') {
    return (
      <InfoBlock
        icon={<Loader2Icon className="size-8 animate-spin text-brand" />}
        title={t('pending.title')}
        description={t('pending.description')}
      />
    );
  }

  if (status === 'success') {
    return (
      <InfoBlock
        icon={<CheckCircle2Icon className="size-8 text-brand" />}
        title={t('success.title')}
        description={t('success.description')}
        action={
          <Button
            type="button"
            className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
            onClick={handleContinue}
            disabled={isContinuing}
          >
            {isContinuing ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t('success.continue')}
          </Button>
        }
      />
    );
  }

  if (status === 'network') {
    return (
      <InfoBlock
        icon={<XCircleIcon className="size-8 text-destructive" />}
        title={t('network.title')}
        description={t('network.description')}
      />
    );
  }

  return (
    <InfoBlock
      icon={<XCircleIcon className="size-8 text-destructive" />}
      title={t('invalid.title')}
      description={t('invalid.description')}
    />
  );
}

function InfoBlock({
  icon,
  title,
  description,
  action,
}: {
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
