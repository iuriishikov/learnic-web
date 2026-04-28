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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { registerAction } from '../api/registration';
import { PASSWORD_MIN } from '../model/constants';
import { registerSchema, type RegisterInput } from '../model/registration';
import type { AuthError } from '../model/types';
import { AuthAltButton } from './auth-alt-button';
import { PasswordInput } from './password-input';

export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      patronymic: '',
      password: '',
      email: '',
    },
    mode: 'onTouched',
  });

  const passwordValue = form.watch('password');
  const passwordHintSatisfied = passwordValue.length >= PASSWORD_MIN;

  function onSubmit(values: RegisterInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.ok) {
        const search = new URLSearchParams({ email: values.email });
        router.push(`/verify-email?${search.toString()}`);
        return;
      }
      if (result.error.kind === 'emailTaken') {
        form.setError('email', { message: 'emailTaken' });
        return;
      }
      if (result.error.kind === 'invalidEmail') {
        form.setError('email', { message: 'emailInvalid' });
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
      if (result.error.kind === 'fieldTooLong') {
        const messageByField: Record<string, string> = {
          firstName: 'firstNameTooLong',
          lastName: 'lastNameTooLong',
          patronymic: 'patronymicTooLong',
        };
        const message = messageByField[result.error.field];
        if (message && result.error.field !== 'description') {
          form.setError(result.error.field, { message });
          return;
        }
      }
      if (result.error.kind === 'validation') {
        if (result.error.fields) {
          for (const [field, code] of Object.entries(result.error.fields)) {
            if (
              field === 'firstName' ||
              field === 'lastName' ||
              field === 'patronymic'
            ) {
              form.setError(field, { message: code });
            }
          }
        }
        setFormError({ kind: 'validation' });
        return;
      }
      setFormError(result.error);
    });
  }

  const submitting = form.formState.isSubmitting || isPending;
  const errors = form.formState.errors;
  const passwordTouched = form.formState.touchedFields.password;
  const hintState = errors.password
    ? 'error'
    : passwordTouched && passwordHintSatisfied
      ? 'valid'
      : 'idle';

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-first-name">
          {t('fields.firstName.label')}
        </Label>
        <Input
          id="register-first-name"
          type="text"
          autoComplete="given-name"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.firstName.placeholder')}
          aria-invalid={Boolean(errors.firstName)}
          {...form.register('firstName')}
        />
        {errors.firstName?.message ? (
          <p className="text-sm text-destructive">
            {t(`errors.${errors.firstName.message}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-last-name">
          {t('fields.lastName.label')}
        </Label>
        <Input
          id="register-last-name"
          type="text"
          autoComplete="family-name"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.lastName.placeholder')}
          aria-invalid={Boolean(errors.lastName)}
          {...form.register('lastName')}
        />
        {errors.lastName?.message ? (
          <p className="text-sm text-destructive">
            {t(`errors.${errors.lastName.message}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-patronymic">
          {t('fields.patronymic.label')}
          <span className="ml-1 text-muted-foreground">
            {t('fields.patronymic.optional')}
          </span>
        </Label>
        <Input
          id="register-patronymic"
          type="text"
          autoComplete="additional-name"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.patronymic.placeholder')}
          {...form.register('patronymic')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">
          {t('fields.password.label')}
        </Label>
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.password.placeholderCreate')}
          showToggleLabel={t('fields.password.show')}
          hideToggleLabel={t('fields.password.hide')}
          aria-invalid={Boolean(errors.password)}
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
            {errors.password?.message
              ? t(`errors.${errors.password.message}`)
              : t('fields.password.hint', { min: PASSWORD_MIN })}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">{t('fields.email.label')}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          className="h-11 rounded-lg px-3.5 text-[15px]"
          placeholder={t('fields.email.placeholder')}
          aria-invalid={Boolean(errors.email)}
          {...form.register('email')}
        />
        {errors.email?.message ? (
          <p className="text-sm text-destructive">
            {t(`errors.${errors.email.message}`)}
          </p>
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

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
        >
          {submitting ? t('register.submitting') : t('register.submit')}
        </Button>
        <AuthAltButton
          href="/login"
          label={t('register.switchToLogin')}
          disabled={submitting}
        />
      </div>
    </form>
  );
}
