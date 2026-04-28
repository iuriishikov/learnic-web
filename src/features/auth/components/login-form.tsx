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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { loginAction } from '../api/login';
import { loginSchema, type LoginInput } from '../model/login';
import type { AuthError } from '../model/types';
import { AuthAltButton } from './auth-alt-button';
import { PasswordInput } from './password-input';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const showResetSuccess = searchParams.get('reset') === 'success';
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
        router.replace('/');
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{t('fields.email.label')}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.email.placeholder')}
          aria-invalid={Boolean(emailError)}
          {...form.register('email')}
        />
        {emailError ? (
          <p className="text-sm text-destructive">{t(`errors.${emailError}`)}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">{t('fields.password.label')}</Label>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.password.placeholderEnter')}
          showToggleLabel={t('fields.password.show')}
          hideToggleLabel={t('fields.password.hide')}
          aria-invalid={Boolean(passwordError)}
          {...form.register('password')}
        />
        {passwordError ? (
          <p className="text-sm text-destructive">
            {t(`errors.${passwordError}`)}
          </p>
        ) : null}
      </div>

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
        />
      </div>
    </form>
  );
}
