'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheckIcon, MailIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState, useTransition, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { TextInput } from '@/shared/ui/input-extended';
import { Label } from '@/shared/ui/label';

import { requestPasswordResetAction } from '../api/password-reset';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '../model/password-reset';
import type { AuthError } from '../model/types';

type PasswordResetDialogProps = {
  trigger: ReactElement;
};

const STEP_TRANSITION = { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] } as const;

export function PasswordResetDialog({ trigger }: PasswordResetDialogProps) {
  const t = useTranslations('settings.security.password.dialog');
  const tAuth = useTranslations('auth');
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSubmittedEmail(null);
      setFormError(null);
      form.reset({ email: '' });
    }
  }

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

  const submitting = form.formState.isSubmitting || isPending;
  const emailError = form.formState.errors.email?.message;

  const stepTransition = reduceMotion ? { duration: 0 } : STEP_TRANSITION;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait" initial={false}>
          {submittedEmail ? (
            <motion.div
              key="sent"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={stepTransition}
              className="flex flex-col gap-5"
            >
              <DialogHeader>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <MailCheckIcon className="size-6 text-brand" aria-hidden />
                </div>
                <DialogTitle className="text-lg">{t('sent.title')}</DialogTitle>
                <DialogDescription>
                  {t('sent.description', { email: submittedEmail })}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmittedEmail(null);
                    setFormError(null);
                    form.reset({ email: '' });
                  }}
                >
                  {t('sent.resend')}
                </Button>
                <DialogClose render={<Button type="button" />}>
                  {t('sent.close')}
                </DialogClose>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={stepTransition}
              className="flex flex-col gap-5"
            >
              <DialogHeader>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <MailIcon className="size-6 text-brand" aria-hidden />
                </div>
                <DialogTitle className="text-lg">{t('title')}</DialogTitle>
                <DialogDescription>{t('description')}</DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="settings-password-reset-email">
                    {tAuth('fields.email.label')}
                  </Label>
                  <TextInput
                    id="settings-password-reset-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    className="h-11 rounded-lg text-[15px]"
                    placeholder={tAuth('fields.email.placeholder')}
                    aria-invalid={Boolean(emailError)}
                    {...form.register('email')}
                  />
                  {emailError ? (
                    <p className="text-sm text-destructive">
                      {tAuth(`errors.${emailError}`)}
                    </p>
                  ) : null}
                </div>

                {formError && formError.kind !== 'validation' ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {formError.kind === 'network'
                        ? tAuth('errors.network')
                        : formError.kind === 'unknown'
                          ? (formError.message ?? tAuth('errors.unknown'))
                          : tAuth('errors.unknown')}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <DialogClose
                    render={
                      <Button type="button" variant="outline" disabled={submitting} />
                    }
                  >
                    {t('cancel')}
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {submitting ? t('submitting') : t('submit')}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
