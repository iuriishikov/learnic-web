'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  avatarHaloClasses,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DatePicker } from '@/shared/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { TextInput } from '@/shared/ui/input-extended';
import { RequiredMark } from '@/shared/ui/required-mark';
import { DescriptionTextarea } from '@/shared/ui/textarea-extended';

import {
  useAddExperienceMutation,
  useRemoveExperienceIconMutation,
  useUpdateExperienceMutation,
} from '../api/use-experiences';
import {
  DESCRIPTION_MAX,
  SOURCE_URL_MAX,
  TITLE_MAX,
  experienceFormSchema,
  type ExperienceFormInput,
} from '../model/form';
import type { UserExperience } from '../model/types';

const ICON_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';
const ICON_MAX_BYTES = 5 * 1024 * 1024;

// The form stores dates as `YYYY-MM-DD` strings (see model/form.ts ISO_DATE).
// DatePicker speaks `Date`; parse/format in local time to avoid a UTC shift
// turning "2026-05-15" into the previous day east of UTC.
function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function formatIsoDate(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ExperienceFormDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in edit mode and pre-populated. */
  editing?: UserExperience | null;
};

export function ExperienceFormDialog({
  userId,
  open,
  onOpenChange,
  editing,
}: ExperienceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden sm:max-w-lg">
        {/* Re-mounting on open + identity change cleanly re-seeds the form
            without setState-in-effect. */}
        {open ? (
          <ExperienceForm
            key={editing?.id ?? 'new'}
            userId={userId}
            editing={editing ?? null}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ExperienceForm({
  userId,
  editing,
  onClose,
}: {
  userId: string;
  editing: UserExperience | null;
  onClose: () => void;
}) {
  const t = useTranslations('settings.experience.dialog');
  const tErrors = useTranslations('settings.experience.errors');
  const tCommon = useTranslations('settings.actions');
  const notify = useNotify();

  const titleId = useId();
  const descriptionId = useId();
  const ongoingId = useId();
  const sourceUrlId = useId();

  const defaults: ExperienceFormInput = useMemo(
    () => ({
      title: editing?.title ?? '',
      description: editing?.description ?? '',
      startDate: editing?.startDate ?? '',
      endDate: editing?.endDate ?? '',
      ongoing: editing ? editing.endDate === null : false,
      sourceUrl: editing?.sourceUrl ?? '',
    }),
    [editing],
  );

  const form = useForm<ExperienceFormInput>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const ongoing = form.watch('ongoing');
  const description = form.watch('description');
  const remaining = Math.max(DESCRIPTION_MAX - (description?.length ?? 0), 0);

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconRemoved, setIconRemoved] = useState(false);
  const previewUrl = useObjectUrl(iconFile);
  const displayIconUrl =
    previewUrl ?? (iconRemoved ? null : (editing?.icon?.url ?? null));
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackInitial =
    form.watch('title').trim().charAt(0).toUpperCase() ||
    editing?.title.trim().charAt(0).toUpperCase() ||
    '?';

  const removeIcon = useRemoveExperienceIconMutation(userId);
  const addMutation = useAddExperienceMutation(userId);
  const updateMutation = useUpdateExperienceMutation(userId);
  const pending = addMutation.isPending || updateMutation.isPending;

  function handlePickIcon() {
    iconInputRef.current?.click();
  }

  function handleIconChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > ICON_MAX_BYTES) {
      notify.error(tErrors('iconTooLarge'));
      return;
    }
    setIconFile(file);
    setIconRemoved(false);
  }

  function handleRemoveIcon() {
    // If the user picked a fresh file that's not yet uploaded — just drop
    // the local preview. If there's an existing remote icon — call the
    // backend right away; cancel-from-dialog should not undo this either.
    if (iconFile) {
      setIconFile(null);
      return;
    }
    if (editing?.icon) {
      removeIcon.mutate(
        { id: editing.id },
        {
          onSuccess: () => setIconRemoved(true),
          onError: () => notify.error(tErrors('iconRemoveFailed')),
        },
      );
    }
  }

  async function onSubmit(values: ExperienceFormInput) {
    const payload = {
      title: values.title.trim(),
      startDate: values.startDate,
      endDate: values.ongoing ? null : values.endDate || null,
      description: values.description?.trim() || null,
      sourceUrl: values.sourceUrl?.trim() || null,
      iconFile,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        notify.success(t('updated'));
      } else {
        await addMutation.mutateAsync(payload);
        notify.success(t('created'));
      }
      onClose();
    } catch {
      notify.error(tErrors('saveFailed'));
    }
  }

  const errors = form.formState.errors;
  const titleText = editing ? t('editTitle') : t('createTitle');
  const descriptionText = editing
    ? t('editDescription')
    : t('createDescription');

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <DialogHeader className="mb-6">
        <DialogTitle>{titleText}</DialogTitle>
        <DialogDescription>{descriptionText}</DialogDescription>
      </DialogHeader>

      <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {/* Icon */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t('fields.icon.label')}
          </span>
          <div className="flex items-center gap-4">
            <Avatar className={cn('size-14 shrink-0', avatarHaloClasses)}>
              {displayIconUrl ? (
                <AvatarImage src={displayIconUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
            <input
              ref={iconInputRef}
              type="file"
              accept={ICON_ACCEPT}
              className="hidden"
              onChange={handleIconChange}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handlePickIcon}
                disabled={pending}
              >
                <ImageIcon className="size-4" aria-hidden />
                {displayIconUrl
                  ? t('fields.icon.replace')
                  : t('fields.icon.upload')}
              </Button>
              {displayIconUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemoveIcon}
                  disabled={pending || removeIcon.isPending}
                >
                  <Trash2Icon className="size-4" aria-hidden />
                  {t('fields.icon.remove')}
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('fields.icon.hint')}
          </p>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={titleId}
            className="text-sm font-medium text-foreground"
          >
            {t('fields.title.label')}
            <RequiredMark />
          </label>
          <TextInput
            id={titleId}
            autoFocus
            placeholder={t('fields.title.placeholder')}
            maxLength={TITLE_MAX}
            aria-invalid={Boolean(errors.title)}
            {...form.register('title')}
          />
          {errors.title?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.title.message)}
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={descriptionId}
            className="text-sm font-medium text-foreground"
          >
            {t('fields.description.label')}
          </label>
          <DescriptionTextarea
            id={descriptionId}
            placeholder={t('fields.description.placeholder')}
            className="min-h-24"
            aria-invalid={Boolean(errors.description)}
            {...form.register('description')}
          />
          <p className="text-xs text-muted-foreground">
            {t('fields.description.charactersLeft', { count: remaining })}
          </p>
          {errors.description?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.description.message)}
            </p>
          ) : null}
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t('fields.startDate.label')}
                <RequiredMark />
              </span>
              <Controller
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    value={parseIsoDate(field.value)}
                    onChange={(date) => {
                      field.onChange(formatIsoDate(date));
                      void form.trigger('startDate');
                      if (!ongoing) void form.trigger('endDate');
                    }}
                    triggerClassName={cn(
                      'w-full',
                      errors.startDate && 'border-destructive',
                    )}
                  />
                )}
              />
              {errors.startDate?.message ? (
                <p className="text-sm text-destructive">
                  {tErrors(errors.startDate.message)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  ongoing ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {t('fields.endDate.label')}
              </span>
              <Controller
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    value={parseIsoDate(field.value)}
                    onChange={(date) => {
                      field.onChange(formatIsoDate(date));
                      void form.trigger('endDate');
                    }}
                    disabled={ongoing}
                    triggerClassName={cn(
                      'w-full',
                      errors.endDate && !ongoing && 'border-destructive',
                    )}
                  />
                )}
              />
              {errors.endDate?.message && !ongoing ? (
                <p className="text-sm text-destructive">
                  {tErrors(errors.endDate.message)}
                </p>
              ) : null}
            </div>
          </div>
          <label
            htmlFor={ongoingId}
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <Checkbox
              id={ongoingId}
              checked={ongoing}
              onCheckedChange={(value) => {
                const next = value === true;
                form.setValue('ongoing', next, { shouldValidate: true });
                if (next) {
                  form.setValue('endDate', '', { shouldValidate: true });
                  form.clearErrors('endDate');
                }
              }}
            />
            {t('fields.ongoing.label')}
          </label>
        </div>

        {/* Source URL */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={sourceUrlId}
            className="text-sm font-medium text-foreground"
          >
            {t('fields.sourceUrl.label')}
          </label>
          <TextInput
            id={sourceUrlId}
            type="url"
            inputMode="url"
            placeholder={t('fields.sourceUrl.placeholder')}
            maxLength={SOURCE_URL_MAX}
            aria-invalid={Boolean(errors.sourceUrl)}
            {...form.register('sourceUrl')}
          />
          <p className="text-xs text-muted-foreground">
            {t('fields.sourceUrl.hint')}
          </p>
          {errors.sourceUrl?.message ? (
            <p className="text-sm text-destructive">
              {tErrors(errors.sourceUrl.message)}
            </p>
          ) : null}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? tCommon('saving') : tCommon('save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
