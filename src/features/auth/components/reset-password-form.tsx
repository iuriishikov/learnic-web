'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { PasswordInput } from '@/shared/ui/input-extended';
import { Label } from '@/shared/ui/label';

import { confirmPasswordResetAction } from '../api/password-reset';
import { PASSWORD_MIN } from '../model/constants';
import { resetPasswordSchema } from '../model/password-reset';
import type { AuthError } from '../model/types';

type ResetPasswordFormProps = {
  token: string;
};

type FormValues = { password: string };

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema.pick({ password: true })),
    defaultValues: { password: '' },
    mode: 'onTouched',
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await confirmPasswordResetAction({
        token,
        password: values.password,
      });
      if (result.ok) {
        const search = new URLSearchParams({ reset: 'success' });
        router.replace(`/login?${search.toString()}`);
        return;
      }
      if (result.error.kind === 'weakPassword') {
        const messageByReason: Record<string, string> = {
          tooShort: 'passwordTooShort',
          tooLong: 'passwordTooLong',
          missingDigit: 'passwordMissingDigit',
          missingUppercase: 'passwordMissingUppercase',
          missingLowercase: 'passwordMissingLowercase',
          missingSpecial: 'passwordMissingSpecial',
        };
        const message = result.error.reason
          ? (messageByReason[result.error.reason] ?? 'passwordWeak')
          : 'passwordWeak';
        form.setError('password', { message });
        return;
      }
      setFormError(result.error);
    });
  }

  const submitting = form.formState.isSubmitting || isPending;
  const passwordValue = form.watch('password');
  const passwordTouched = form.formState.touchedFields.password;
  const passwordError = form.formState.errors.password?.message;
  const hintState = passwordError
    ? 'error'
    : passwordTouched && passwordValue.length >= PASSWORD_MIN
      ? 'valid'
      : 'idle';

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">
          {t('resetPassword.newPasswordLabel')}
        </Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          className="h-11"
          placeholder={t('fields.password.placeholderCreate')}
          toggleLabel={{
            show: t('fields.password.show'),
            hide: t('fields.password.hide'),
          }}
          invalid={Boolean(passwordError)}
          {...form.register('password')}
        />
        <p
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            hintState === 'error' && 'text-destructive',
            hintState === 'valid' && 'text-foreground',
            hintState === 'idle' && 'text-muted-foreground',
          )}
        >
          <CheckCircle2Icon
            className={cn(
              'size-4',
              hintState === 'valid' && 'text-brand',
              hintState === 'error' && 'text-destructive',
              hintState === 'idle' && 'text-muted-foreground',
            )}
            aria-hidden
          />
          <span>
            {passwordError
              ? t(`errors.${passwordError}`)
              : t('fields.password.hint', { min: PASSWORD_MIN })}
          </span>
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {formError.kind === 'invalidToken'
              ? t('resetPassword.errors.invalidToken')
              : formError.kind === 'network'
                ? t('errors.network')
                : formError.kind === 'validation'
                  ? t('errors.unknown')
                  : formError.kind === 'unknown'
                    ? (formError.message ?? t('errors.unknown'))
                    : t('errors.unknown')}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
      >
        {submitting
          ? t('resetPassword.submitting')
          : t('resetPassword.submit')}
      </Button>
    </form>
  );
}
