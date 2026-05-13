'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useNotify } from '@/shared/lib/notify';
import { TextInput } from '@/shared/ui/input-extended';
import { DescriptionTextarea } from '@/shared/ui/textarea-extended';
import {
  AutosaveIndicator,
  SettingsRow,
  SettingsSection,
} from '@/widgets/settings';

import { updateProfileAction } from '../api/profile-update';
import { DESCRIPTION_MAX } from '../model/constants';
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from '../model/profile-update';
import { AvatarUploader } from './avatar-uploader';
import { useAuth } from './auth-provider';
import { CoverUploader } from './cover-uploader';

const AUTOSAVE_DEBOUNCE_MS = 800;
const SAVED_INDICATOR_TTL_MS = 1500;

function buildDefaults(user: {
  firstName: string;
  lastName: string;
  patronymic: string | null;
  description: string | null;
}): ProfileUpdateInput {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    patronymic: user.patronymic ?? '',
    description: user.description ?? '',
  };
}

export function ProfileForm() {
  const t = useTranslations('settings.profile');
  const tAutosave = useTranslations('settings.autosave');
  const tFields = useTranslations('settings.profile.fields');
  const tErrors = useTranslations('settings.errors');
  const notify = useNotify();
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [recentlySavedAt, setRecentlySavedAt] = useState<number | null>(null);

  const firstNameId = useId();
  const lastNameId = useId();
  const patronymicId = useId();
  const descriptionId = useId();
  const emailId = useId();

  const defaults = user
    ? buildDefaults(user)
    : { firstName: '', lastName: '', patronymic: '', description: '' };

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const patronymic = form.watch('patronymic');
  const description = form.watch('description');

  // Keep form in sync when the underlying user changes (e.g. after avatar
  // upload triggers refresh) — but only when the user has not started editing.
  useEffect(() => {
    if (!user) return;
    if (form.formState.isDirty) return;
    form.reset(buildDefaults(user));
  }, [user, form]);

  // Auto-save: every change to a watched field schedules a server PUT
  // after a short debounce. Successive edits cancel the pending timer
  // so we ship one request per pause in typing. Validation runs through
  // ``form.trigger()`` so invalid input never reaches the wire — the
  // existing inline error messages take care of telling the user.
  useEffect(() => {
    if (!user) return;
    if (!form.formState.isDirty) return;

    const timeout = setTimeout(async () => {
      const valid = await form.trigger();
      if (!valid) return;
      const values = form.getValues();
      const previous = buildDefaults(user);
      setSaving(true);
      try {
        const result = await updateProfileAction(values, previous);
        if (result.ok) {
          await refresh();
          form.reset(values);
          setRecentlySavedAt(Date.now());
          return;
        }
        const error = result.error;
        if (error.kind === 'validation' && error.fields) {
          for (const [field, code] of Object.entries(error.fields)) {
            if (
              field === 'firstName' ||
              field === 'lastName' ||
              field === 'patronymic' ||
              field === 'description'
            ) {
              form.setError(field, { message: code });
            }
          }
          notify.error(tErrors('validation'));
          return;
        }
        if (error.kind === 'fieldTooLong') {
          form.setError(error.field, { message: `${error.field}TooLong` });
          notify.error(tErrors('validation'));
          return;
        }
        notify.error(
          error.kind === 'network' ? tErrors('network') : tErrors('saveFailed'),
        );
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [
    firstName,
    lastName,
    patronymic,
    description,
    user,
    form,
    refresh,
    notify,
    tErrors,
  ]);

  // Drop the "Saved" pill after the TTL so it doesn't linger.
  useEffect(() => {
    if (recentlySavedAt === null) return;
    const timeout = setTimeout(
      () => setRecentlySavedAt(null),
      SAVED_INDICATOR_TTL_MS,
    );
    return () => clearTimeout(timeout);
  }, [recentlySavedAt]);

  if (!user) return null;

  const errors = form.formState.errors;
  const remaining = Math.max(DESCRIPTION_MAX - (description?.length ?? 0), 0);

  return (
    <form noValidate>
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
          label={tFields('avatar.label')}
          description={tFields('avatar.description')}
        >
          <AvatarUploader />
        </SettingsRow>

        <SettingsRow
          label={tFields('cover.label')}
          description={tFields('cover.description')}
        >
          <CoverUploader />
        </SettingsRow>

        <SettingsRow label={tFields('lastName.label')} labelFor={lastNameId}>
          <TextInput
            id={lastNameId}
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            className="h-11 max-w-md rounded-lg text-[15px]"
            placeholder={tFields('lastName.placeholder')}
            {...form.register('lastName')}
          />
          {errors.lastName?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.lastName.message)}
            </p>
          ) : null}
        </SettingsRow>

        <SettingsRow label={tFields('firstName.label')} labelFor={firstNameId}>
          <TextInput
            id={firstNameId}
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            className="h-11 max-w-md rounded-lg text-[15px]"
            placeholder={tFields('firstName.placeholder')}
            {...form.register('firstName')}
          />
          {errors.firstName?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.firstName.message)}
            </p>
          ) : null}
        </SettingsRow>

        <SettingsRow
          label={tFields('patronymic.label')}
          description={tFields('patronymic.description')}
          labelFor={patronymicId}
        >
          <TextInput
            id={patronymicId}
            autoComplete="additional-name"
            aria-invalid={Boolean(errors.patronymic)}
            className="h-11 max-w-md rounded-lg text-[15px]"
            placeholder={tFields('patronymic.placeholder')}
            {...form.register('patronymic')}
          />
          {errors.patronymic?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.patronymic.message)}
            </p>
          ) : null}
        </SettingsRow>

        <SettingsRow
          label={tFields('description.label')}
          description={tFields('description.description')}
          labelFor={descriptionId}
        >
          <DescriptionTextarea
            id={descriptionId}
            aria-invalid={Boolean(errors.description)}
            className="min-h-32 max-w-2xl rounded-lg text-[15px]"
            placeholder={tFields('description.placeholder')}
            {...form.register('description')}
          />
          <p className="text-xs text-muted-foreground">
            {tFields('description.charactersLeft', { count: remaining })}
          </p>
          {errors.description?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.description.message)}
            </p>
          ) : null}
        </SettingsRow>

        <SettingsRow
          label={tFields('email.label')}
          description={tFields('email.description')}
          labelFor={emailId}
        >
          <TextInput
            id={emailId}
            value={user.email}
            readOnly
            disabled
            className="h-11 max-w-md rounded-lg text-[15px]"
          />
        </SettingsRow>
      </SettingsSection>
    </form>
  );
}
