'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { FieldRow, TextInput } from '@/shared/ui/input-extended';
import { Kbd } from '@/shared/ui/kbd';
import { Textarea } from '@/shared/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

import { RU_DIAL_PREFIX } from '../lib/ru-phone';
import { contactSchema, type ContactInput } from '../model/contact';
import { RuPhoneInput } from './ru-phone-input';

const FIELD_TRANSITION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;

type ContactFormProps = {
  /** Recipient address for the `mailto:` — sourced from env on the server. */
  contactEmail: string;
  className?: string;
};

export function ContactForm({ contactEmail, className }: ContactFormProps) {
  const t = useTranslations('contact');
  const reduce = useReducedMotion();
  // Display-only and immutable; the shortcut hint lives in a hover tooltip
  // (not in the initial HTML), so reading `navigator` lazily is hydration-safe.
  const [isMac] = React.useState(
    () =>
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform),
  );

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
      consent: false,
    },
    mode: 'onTouched',
  });

  const { errors } = form.formState;

  // On a valid submit, hand off to the OS mail client via a `mailto:` link
  // addressed to the env-configured recipient, with the form data pre-filled.
  function onSubmit(values: ContactInput) {
    const fullPhone = values.phone ? `${RU_DIAL_PREFIX} ${values.phone}` : '';

    const subject = t('mail.subject', {
      name: `${values.firstName} ${values.lastName}`.trim(),
    });
    const body = [
      `${t('mail.name')}: ${values.firstName} ${values.lastName}`,
      `${t('mail.email')}: ${values.email}`,
      fullPhone ? `${t('mail.phone')}: ${fullPhone}` : null,
      '',
      values.message,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const href = `mailto:${contactEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    // Hands off to the OS mail client. `assign` (vs `location.href =`) keeps
    // this a method call, which the React Compiler doesn't flag as a mutation.
    window.location.assign(href);
  }

  function fieldError(name: keyof ContactInput): string | undefined {
    const message = errors[name]?.message;
    return message ? t(`errors.${message}`) : undefined;
  }

  // Cmd/Ctrl+Enter submits from any field, including the message textarea.
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void form.handleSubmit(onSubmit)();
    }
  }

  const item = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: FIELD_TRANSITION },
      };

  return (
    <motion.form
      onSubmit={form.handleSubmit(onSubmit)}
      onKeyDown={handleKeyDown}
      noValidate
      className={cn('flex w-full flex-col gap-5', className)}
      variants={
        reduce
          ? undefined
          : { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
      }
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4"
      >
        <FieldRow
          id="contact-first-name"
          label={t('fields.firstName.label')}
          required
          error={fieldError('firstName')}
        >
          <TextInput
            id="contact-first-name"
            type="text"
            autoComplete="given-name"
            className="h-11"
            placeholder={t('fields.firstName.placeholder')}
            invalid={Boolean(errors.firstName)}
            {...form.register('firstName')}
          />
        </FieldRow>

        <FieldRow
          id="contact-last-name"
          label={t('fields.lastName.label')}
          required
          error={fieldError('lastName')}
        >
          <TextInput
            id="contact-last-name"
            type="text"
            autoComplete="family-name"
            className="h-11"
            placeholder={t('fields.lastName.placeholder')}
            invalid={Boolean(errors.lastName)}
            {...form.register('lastName')}
          />
        </FieldRow>
      </motion.div>

      <motion.div variants={item}>
        <FieldRow
          id="contact-email"
          label={t('fields.email.label')}
          required
          error={fieldError('email')}
        >
          <TextInput
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-11"
            placeholder={t('fields.email.placeholder')}
            invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
        </FieldRow>
      </motion.div>

      <motion.div variants={item}>
        <FieldRow
          id="contact-phone"
          label={t('fields.phone.label')}
          error={fieldError('phone')}
        >
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <RuPhoneInput
                id="contact-phone"
                name={field.name}
                className="h-11"
                placeholder={t('fields.phone.placeholder')}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.phone)}
              />
            )}
          />
        </FieldRow>
      </motion.div>

      <motion.div variants={item}>
        <FieldRow
          id="contact-message"
          label={t('fields.message.label')}
          required
          error={fieldError('message')}
        >
          <Textarea
            id="contact-message"
            className="min-h-32"
            placeholder={t('fields.message.placeholder')}
            invalid={Boolean(errors.message)}
            {...form.register('message')}
          />
        </FieldRow>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <Controller
            control={form.control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="contact-consent"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={errors.consent ? true : undefined}
              />
            )}
          />
          <label
            htmlFor="contact-consent"
            className="text-sm leading-snug text-muted-foreground"
          >
            {t.rich('consent', {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-brand"
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {errors.consent ? (
            <motion.p
              key="consent-error"
              initial={reduce ? undefined : { opacity: 0, y: -2 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -2 }}
              transition={{ duration: 0.15 }}
              role="alert"
              className="text-sm text-destructive"
            >
              {t('errors.consentRequired')}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item}>
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  {t('submit')}
                </Button>
              }
            />
            <TooltipContent>
              {t('submitHint')}
              <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>Enter</Kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </motion.form>
  );
}
