'use client';

import { CheckCircle2Icon, Loader2Icon, MailIcon, XCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import {
  verifyEmailAction,
  waitForEmailVerificationAction,
} from '../api/email-verification';
import { appendFrom, sanitizeRedirectTarget } from '../lib/redirect';

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
  const pollingRef = useRef(false);

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

  useEffect(() => {
    if (token) return;
    if (pollingRef.current) return;
    pollingRef.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (cancelled) return;
      const result = await waitForEmailVerificationAction();
      if (cancelled) return;
      if (result === 'verified') {
        router.push(safeFrom ?? '/marketplace');
        router.refresh();
        return;
      }
      if (result === 'expired') {
        setStatus('expired');
        return;
      }
      const delay = result === 'waiting' ? 1500 : 5000;
      timer = setTimeout(poll, delay);
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      pollingRef.current = false;
    };
  }, [token, router, safeFrom]);

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          <span>{t('verifyEmail.waiting.polling')}</span>
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
