'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth';
import { useNotify } from '@/shared/lib/notify';
import { HttpsUrlInput } from '@/shared/ui/https-url-input';
import { TextInput } from '@/shared/ui/input-extended';
import {
  AutosaveIndicator,
  SettingsRow,
  SettingsSection,
} from '@/widgets/settings';

import {
  changePortfolioUrlAction,
  changePublicEmailAction,
  changeWebsiteUrlAction,
} from '../api/contacts';
import {
  PORTFOLIO_URL_MAX,
  PUBLIC_EMAIL_MAX,
  WEBSITE_URL_MAX,
  portfolioUrlSchema,
  publicEmailSchema,
  websiteUrlSchema,
} from '../model/form';

import { SocialLinksEditor } from './social-links-editor';

const AUTOSAVE_DEBOUNCE_MS = 800;
const SAVED_TTL_MS = 1500;

type FieldKey = 'website' | 'portfolio' | 'publicEmail';

export function ContactsSettingsView() {
  const t = useTranslations('settings.contacts');
  const tAutosave = useTranslations('settings.autosave');
  const tErrors = useTranslations('settings.contacts.errors');
  const notify = useNotify();
  const { user, refresh } = useAuth();

  const websiteId = useId();
  const portfolioId = useId();
  const publicEmailId = useId();

  if (!user) return null;
  // Stable identity inside autosave effects + memoization.
  // `refresh` returns the latest profile after each PUT.
  return (
    <ContactsView
      key={user.oid}
      initialWebsite={user.websiteUrl ?? ''}
      initialPortfolio={user.portfolioUrl ?? ''}
      initialPublicEmail={user.publicEmail ?? ''}
      userId={user.oid}
      onSaved={async () => {
        await refresh();
      }}
      labels={{ t, tAutosave, tErrors }}
      notify={notify}
      websiteId={websiteId}
      portfolioId={portfolioId}
      publicEmailId={publicEmailId}
    />
  );
}

type Labels = {
  t: ReturnType<typeof useTranslations>;
  tAutosave: ReturnType<typeof useTranslations>;
  tErrors: ReturnType<typeof useTranslations>;
};

function ContactsView({
  initialWebsite,
  initialPortfolio,
  initialPublicEmail,
  userId,
  onSaved,
  labels,
  notify,
  websiteId,
  portfolioId,
  publicEmailId,
}: {
  initialWebsite: string;
  initialPortfolio: string;
  initialPublicEmail: string;
  userId: string;
  onSaved: () => Promise<void>;
  labels: Labels;
  notify: ReturnType<typeof useNotify>;
  websiteId: string;
  portfolioId: string;
  publicEmailId: string;
}) {
  const { t, tAutosave, tErrors } = labels;
  const [website, setWebsite] = useState(initialWebsite);
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [publicEmail, setPublicEmail] = useState(initialPublicEmail);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [recentlySavedAt, setRecentlySavedAt] = useState<number | null>(null);

  useDebouncedAutosave({
    value: website,
    initialValue: initialWebsite,
    validate: (v) => websiteUrlSchema.safeParse(v),
    save: async (next) => {
      const result = await changeWebsiteUrlAction(next === '' ? null : next);
      return result.ok ? null : 'saveFailed';
    },
    onFieldError: (code) => setErrors((e) => ({ ...e, website: code })),
    onSavingChange: setSaving,
    onSaved: () => {
      setErrors((e) => ({ ...e, website: undefined }));
      setRecentlySavedAt(Date.now());
      onSaved();
    },
    onFailure: () => notify.error(tErrors('saveFailed')),
  });
  useDebouncedAutosave({
    value: portfolio,
    initialValue: initialPortfolio,
    validate: (v) => portfolioUrlSchema.safeParse(v),
    save: async (next) => {
      const result = await changePortfolioUrlAction(next === '' ? null : next);
      return result.ok ? null : 'saveFailed';
    },
    onFieldError: (code) => setErrors((e) => ({ ...e, portfolio: code })),
    onSavingChange: setSaving,
    onSaved: () => {
      setErrors((e) => ({ ...e, portfolio: undefined }));
      setRecentlySavedAt(Date.now());
      onSaved();
    },
    onFailure: () => notify.error(tErrors('saveFailed')),
  });
  useDebouncedAutosave({
    value: publicEmail,
    initialValue: initialPublicEmail,
    validate: (v) => publicEmailSchema.safeParse(v),
    save: async (next) => {
      const result = await changePublicEmailAction(next === '' ? null : next);
      return result.ok ? null : 'saveFailed';
    },
    onFieldError: (code) => setErrors((e) => ({ ...e, publicEmail: code })),
    onSavingChange: setSaving,
    onSaved: () => {
      setErrors((e) => ({ ...e, publicEmail: undefined }));
      setRecentlySavedAt(Date.now());
      onSaved();
    },
    onFailure: () => notify.error(tErrors('saveFailed')),
  });

  // Drop the "Saved" pill after the TTL.
  useEffect(() => {
    if (recentlySavedAt === null) return;
    const t = setTimeout(() => setRecentlySavedAt(null), SAVED_TTL_MS);
    return () => clearTimeout(t);
  }, [recentlySavedAt]);

  return (
    <>
      <SettingsSection
        title={t('title')}
        description={t('description')}
        headerActions={
          <AutosaveIndicator
            saving={saving}
            justSaved={recentlySavedAt !== null}
            savingLabel={tAutosave('saving')}
            savedLabel={tAutosave('saved')}
          />
        }
      >
        <SettingsRow
          label={t('fields.website.label')}
          description={t('fields.website.description')}
          labelFor={websiteId}
        >
          <HttpsUrlInput
            id={websiteId}
            placeholder={t('fields.website.placeholder')}
            maxLength={WEBSITE_URL_MAX}
            aria-invalid={Boolean(errors.website)}
            groupClassName="h-11 max-w-md rounded-lg"
            className="text-[15px]"
            value={website}
            onValueChange={setWebsite}
          />
          {errors.website ? (
            <p className="text-sm text-destructive">{tErrors(errors.website)}</p>
          ) : null}
        </SettingsRow>
        <SettingsRow
          label={t('fields.portfolio.label')}
          description={t('fields.portfolio.description')}
          labelFor={portfolioId}
        >
          <HttpsUrlInput
            id={portfolioId}
            placeholder={t('fields.portfolio.placeholder')}
            maxLength={PORTFOLIO_URL_MAX}
            aria-invalid={Boolean(errors.portfolio)}
            groupClassName="h-11 max-w-md rounded-lg"
            className="text-[15px]"
            value={portfolio}
            onValueChange={setPortfolio}
          />
          {errors.portfolio ? (
            <p className="text-sm text-destructive">{tErrors(errors.portfolio)}</p>
          ) : null}
        </SettingsRow>
        <SettingsRow
          label={t('fields.publicEmail.label')}
          description={t('fields.publicEmail.description')}
          labelFor={publicEmailId}
        >
          <TextInput
            id={publicEmailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('fields.publicEmail.placeholder')}
            maxLength={PUBLIC_EMAIL_MAX}
            aria-invalid={Boolean(errors.publicEmail)}
            className="h-11 max-w-md rounded-lg text-[15px]"
            value={publicEmail}
            onChange={(e) => setPublicEmail(e.target.value)}
          />
          {errors.publicEmail ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.publicEmail)}
            </p>
          ) : null}
        </SettingsRow>
      </SettingsSection>

      <div className="mt-10">
        <SocialLinksEditor userId={userId} />
      </div>
    </>
  );
}

/**
 * Field-level autosave: every change to ``value`` schedules a server PUT
 * after :data:`AUTOSAVE_DEBOUNCE_MS`. Successive edits cancel the pending
 * timer so we ship one request per pause in typing. Validation runs
 * through the supplied :func:`validate` (zod) so invalid input never
 * reaches the wire.
 *
 * Callback props are funneled through a ref so the effect only depends
 * on ``value`` / ``initialValue``. Without this the effect would re-run
 * on every parent render (inline arrow callbacks change identity each
 * pass), restart the debounce timer, and the save would never fire.
 */
type AutosaveCallbacks = {
  validate: (
    v: string,
  ) => { success: true } | { success: false; error: { issues: { message: string }[] } };
  save: (next: string) => Promise<string | null>;
  onFieldError: (code: string | undefined) => void;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
  onFailure: () => void;
};

function useDebouncedAutosave({
  value,
  initialValue,
  ...callbacks
}: { value: string; initialValue: string } & AutosaveCallbacks) {
  const callbacksRef = useRef<AutosaveCallbacks>(callbacks);
  // Sync the ref to the latest props in an effect (not during render) —
  // satisfies React's "no side effects during render" rule. Effectively
  // synchronous: the user-visible work happens after a 900ms debounce,
  // long after the effect has flushed.
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (value === initialValue) return;
    const timer = setTimeout(async () => {
      const cb = callbacksRef.current;
      const parsed = cb.validate(value);
      if (!parsed.success) {
        cb.onFieldError(parsed.error.issues[0]?.message);
        return;
      }
      cb.onSavingChange(true);
      try {
        const code = await cb.save(value);
        if (code) {
          cb.onFieldError(code);
          cb.onFailure();
          return;
        }
        cb.onSaved();
      } finally {
        cb.onSavingChange(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, initialValue]);
}
