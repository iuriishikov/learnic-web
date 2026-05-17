'use client';

import { CheckCircle2Icon, Loader2Icon, MailIcon, XCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import {
  resendVerificationAction,
  verifyEmailAction,
  waitForEmailVerificationAction,
} from '../api/email-verification';
import { useConfirmEvents } from '../hooks/use-confirm-events';
import { appendFrom, sanitizeRedirectTarget } from '@/shared/lib/redirect';

type Status =
  | 'verifying-token'
  | 'verify-success'
  | 'verify-error'
  | 'waiting'
  | 'expired';

type VerifyEmailClientProps = {
  token?: string;
  email?: string;
  from?: string;
};

export function VerifyEmailClient({
  token,
  email,
  from,
}: VerifyEmailClientProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const safeFrom = sanitizeRedirectTarget(from);
  const loginHref = appendFrom('/login', safeFrom);
  const [status, setStatus] = useState<Status>(() =>
    token ? 'verifying-token' : 'waiting',
  );
  const finalizingRef = useRef(false);
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'sending' | 'sent' | 'expired' | 'error'
  >('idle');
  const [isResending, startResendTransition] = useTransition();

  function handleResend() {
    if (resendStatus === 'sending' || isResending) return;
    setResendStatus('sending');
    startResendTransition(async () => {
      const result = await resendVerificationAction();
      if (result.ok) {
        setResendStatus('sent');
        return;
      }
      if (result.error.kind === 'invalidToken') {
        setResendStatus('expired');
        setStatus('expired');
        return;
      }
      setResendStatus('error');
    });
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const result = await verifyEmailAction({ token });
      if (cancelled) return;
      setStatus(result.ok ? 'verify-success' : 'verify-error');
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Finalize the signup tab once the user clicks the verification
  // link on another device/tab. WS push (`useConfirmEvents` below)
  // tells us the consume happened on the backend; we still need ONE
  // HTTP call to ``/auth/email-verification/wait`` to install the
  // auth cookies on this tab — cookies cannot be set via a WS frame.
  const finalize = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    const result = await waitForEmailVerificationAction();
    if (result === 'verified') {
      router.push(safeFrom ?? '/marketplace');
      router.refresh();
      return;
    }
    if (result === 'expired') {
      setStatus('expired');
      finalizingRef.current = false;
      return;
    }
    // ``waiting`` after a confirmed push means our subscription raced
    // ahead of replication or the user is in fact not the same one;
    // back off and let the WS deliver the next push.
    finalizingRef.current = false;
  }, [router, safeFrom]);

  useConfirmEvents({
    purpose: 'verify',
    enabled: !token,
    onConfirmed: finalize,
    // No replay on the server. A reconnect after a missed push could
    // mean we already verified; ask the wait-endpoint once just in
    // case so we don't sit on a stale ``waiting`` UI.
    onReconnected: finalize,
    onTerminalClose: () => setStatus('expired'),
  });

  if (status === 'verifying-token') {
    return (
      <InfoBlock
        icon={<Loader2Icon className="size-8 animate-spin text-brand" />}
        title={t('verifyEmail.verifying.title')}
        description={t('verifyEmail.verifying.description')}
      />
    );
  }

  if (status === 'verify-success') {
    return (
      <InfoBlock
        icon={<CheckCircle2Icon className="size-8 text-brand" />}
        title={t('verifyEmail.success.title')}
        description={t('verifyEmail.success.description')}
        action={
          <Button
            className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
            render={<Link href={loginHref} />}
            nativeButton={false}
          >
            {t('verifyEmail.success.logIn')}
          </Button>
        }
      />
    );
  }

  if (status === 'verify-error') {
    return (
      <InfoBlock
        icon={<XCircleIcon className="size-8 text-destructive" />}
        title={t('verifyEmail.tokenError.title')}
        description={t('verifyEmail.tokenError.description')}
        action={
          <Button
            variant="outline"
            className="h-11 rounded-lg text-[15px] font-semibold"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            {t('verifyEmail.tokenError.registerAgain')}
          </Button>
        }
      />
    );
  }

  if (status === 'expired') {
    return (
      <InfoBlock
        icon={<XCircleIcon className="size-8 text-destructive" />}
        title={t('verifyEmail.expired.title')}
        description={t('verifyEmail.expired.description')}
        action={
          <Button
            className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            {t('verifyEmail.expired.registerAgain')}
          </Button>
        }
      />
    );
  }

  // status === 'waiting'
  const resendLabel =
    resendStatus === 'sending' || isResending
      ? t('verifyEmail.resend.sending')
      : resendStatus === 'sent'
        ? t('verifyEmail.resend.sent')
        : resendStatus === 'error'
          ? t('verifyEmail.resend.error')
          : t('verifyEmail.resend.cta');

  return (
    <InfoBlock
      icon={<MailIcon className="size-8 text-brand" />}
      title={t('verifyEmail.waiting.title')}
      description={
        email
          ? t('verifyEmail.waiting.descriptionWithEmail', { email })
          : t('verifyEmail.waiting.description')
      }
      action={
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            <span>{t('verifyEmail.waiting.polling')}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg text-[15px] font-semibold"
            onClick={handleResend}
            disabled={
              resendStatus === 'sending' ||
              resendStatus === 'sent' ||
              isResending
            }
          >
            {resendLabel}
          </Button>
        </div>
      }
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
