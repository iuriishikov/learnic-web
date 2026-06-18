'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  EmailInput,
  FieldRow,
  PasswordInput,
} from '@/shared/ui/input-extended';

import { loginAction } from '../api/login';
import { sanitizeRedirectTarget } from '@/shared/lib/redirect';
import { loginSchema, type LoginInput } from '../model/login';
import type { AuthError } from '../model/types';
import { AuthAltButton } from './auth-alt-button';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const showResetSuccess = searchParams.get('reset') === 'success';
  const fromParam = searchParams.get('from');
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        const safeFrom = sanitizeRedirectTarget(fromParam);
        router.replace(safeFrom ?? '/');
        return;
      }
      setFormError(result.error);
    });
  }

  const submitting = form.formState.isSubmitting || isPending;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {showResetSuccess ? (
        <Alert className="border-brand/40 bg-brand/5 text-foreground">
          <CheckCircle2Icon className="size-4 text-brand" aria-hidden />
          <AlertDescription className="text-foreground">
            {t('login.resetSuccess')}
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldRow
        id="login-email"
        label={t('fields.email.label')}
        error={emailError ? t(`errors.${emailError}`) : undefined}
      >
        <EmailInput
          id="login-email"
          className="h-11"
          placeholder={t('fields.email.placeholder')}
          invalid={Boolean(emailError)}
          {...form.register('email')}
        />
      </FieldRow>

      <FieldRow
        id="login-password"
        label={t('fields.password.label')}
        error={passwordError ? t(`errors.${passwordError}`) : undefined}
      >
        <PasswordInput
          id="login-password"
          className="h-11"
          placeholder={t('fields.password.placeholderEnter')}
          toggleLabel={{
            show: t('fields.password.show'),
            hide: t('fields.password.hide'),
          }}
          invalid={Boolean(passwordError)}
          {...form.register('password')}
        />
      </FieldRow>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {formError.kind === 'invalidCredentials'
              ? t('errors.invalidCredentials')
              : formError.kind === 'emailNotVerified'
                ? t('errors.emailNotVerified')
                : formError.kind === 'network'
                  ? t('errors.network')
                  : formError.kind === 'unknown'
                    ? (formError.message ?? t('errors.unknown'))
                    : t('errors.unknown')}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
        >
          {submitting ? t('login.submitting') : t('login.submit')}
        </Button>
        <AuthAltButton
          href="/register"
          label={t('login.switchToRegister')}
          disabled={submitting}
          from={fromParam}
        />
      </div>
    </form>
  );
}
