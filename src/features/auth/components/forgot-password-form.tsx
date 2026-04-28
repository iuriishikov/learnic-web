'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { requestPasswordResetAction } from '../api/password-reset';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '../model/password-reset';
import type { AuthError } from '../model/types';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (result.ok) {
        setSubmittedEmail(values.email);
        return;
      }
      if (result.error.kind === 'invalidEmail') {
        form.setError('email', { message: 'emailInvalid' });
        return;
      }
      setFormError(result.error);
    });
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <MailCheckIcon className="size-6 text-brand" aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            {t('forgotPassword.success.title')}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            {t('forgotPassword.success.description', { email: submittedEmail })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-lg text-[15px] font-semibold"
          onClick={() => {
            setSubmittedEmail(null);
            form.reset({ email: '' });
          }}
        >
          {t('forgotPassword.success.resend')}
        </Button>
      </div>
    );
  }

  const submitting = form.formState.isSubmitting || isPending;
  const emailError = form.formState.errors.email?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">{t('fields.email.label')}</Label>
        <Input
          id="forgot-email"
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

      {formError && formError.kind !== 'validation' ? (
        <Alert variant="destructive">
          <AlertDescription>
            {formError.kind === 'network'
              ? t('errors.network')
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
          ? t('forgotPassword.submitting')
          : t('forgotPassword.submit')}
      </Button>
    </form>
  );
}
