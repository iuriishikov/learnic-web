'use client';

import {
  CheckIcon,
  FileIcon,
  FlagIcon,
  ImageIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import { formatBytes } from '@/shared/lib/format-bytes';
import { cn } from '@/shared/lib/utils';
import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FileDropZone } from '@/shared/ui/file-drop-zone';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const REASON_MIN = 10;
const REASON_MAX = 600;
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
const ACCEPTED_TYPES = 'image/*,application/pdf';
// Mock latency to mimic the network call we'll wire up later.
const MOCK_SUBMIT_DELAY_MS = 800;

const CATEGORIES = [
  'spam',
  'inappropriate',
  'fraud',
  'harassment',
  'impersonation',
  'other',
] as const;
type Category = (typeof CATEGORIES)[number];

type ProfileReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
};

type Attachment = {
  id: string;
  file: File;
};

function attachmentKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function ProfileReportDialog({
  open,
  onOpenChange,
  profileName,
}: ProfileReportDialogProps) {
  const t = useTranslations('user-profile.report');
  const tCategories = useTranslations('user-profile.report.categories');
  const notify = useNotify();
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<Category | null>(null);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const trimmedLength = reason.trim().length;
  const reasonOk = trimmedLength >= REASON_MIN;
  const canSubmit = !submitting && category !== null && reasonOk;
  const counterTone =
    reason.length > REASON_MAX * 0.9
      ? 'text-amber-600 dark:text-amber-400'
      : reasonOk
        ? 'text-foreground'
        : 'text-muted-foreground';

  const reset = () => {
    setCategory(null);
    setReason('');
    setAttachments([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting && !next) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (arr.length === 0) return;

    const oversized = arr.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    const accepted = arr.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);

    oversized.forEach((f) => {
      notify.error(t('attachErrorSize', { name: f.name, maxSize: MAX_FILE_SIZE_MB }));
    });

    if (accepted.length === 0) return;

    setAttachments((prev) => {
      const seen = new Set(prev.map((a) => attachmentKey(a.file)));
      const additions: Attachment[] = [];
      for (const file of accepted) {
        const key = attachmentKey(file);
        if (seen.has(key)) continue;
        seen.add(key);
        additions.push({ id: `${key}-${Math.random().toString(36).slice(2, 8)}`, file });
      }
      const merged = [...prev, ...additions];
      if (merged.length > MAX_FILES) {
        notify.error(t('attachErrorCount', { maxFiles: MAX_FILES }));
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // TODO: wire to backend. For now, mock the round-trip.
    await new Promise((resolve) => setTimeout(resolve, MOCK_SUBMIT_DELAY_MS));
    setSubmitting(false);
    reset();
    onOpenChange(false);
    notify.success(t('successTitle'), {
      description: t('successDescription'),
    });
  };

  const reasonHint = !reason
    ? t('reasonHintEmpty', { min: REASON_MIN })
    : !reasonOk
      ? t('reasonHintShort', { remaining: REASON_MIN - trimmedLength })
      : t('reasonHintOk');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15"
            >
              <FlagIcon className="size-5" />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <DialogTitle>{t('title')}</DialogTitle>
              <DialogDescription>
                {t('description', { name: profileName })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2" disabled={submitting}>
            <legend className="mb-1 text-sm font-medium text-foreground">
              {t('categoryLabel')}
            </legend>
            <div
              role="radiogroup"
              aria-label={t('categoryLabel')}
              className="grid grid-cols-2 gap-2"
            >
              {CATEGORIES.map((value) => {
                const isSelected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setCategory(value)}
                    data-selected={isSelected || undefined}
                    className={cn(
                      'group/category relative flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors outline-none',
                      'border-input text-muted-foreground hover:border-input/80 hover:bg-muted hover:text-foreground',
                      'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
                      'data-[selected]:border-destructive data-[selected]:bg-destructive/5 data-[selected]:text-destructive',
                      'data-[selected]:focus-visible:ring-destructive/30',
                      'disabled:cursor-not-allowed disabled:opacity-60',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                        'border-input',
                        'group-data-[selected]/category:border-destructive group-data-[selected]/category:bg-destructive group-data-[selected]/category:text-destructive-foreground',
                      )}
                    >
                      <CheckIcon
                        className={cn(
                          'size-3 opacity-0 transition-opacity',
                          'group-data-[selected]/category:opacity-100',
                        )}
                      />
                    </span>
                    <span className="truncate font-medium">
                      {tCategories(value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="profile-report-reason">{t('reasonLabel')}</Label>
              <span className={cn('text-xs tabular-nums', counterTone)}>
                {reason.length} / {REASON_MAX}
              </span>
            </div>
            <Textarea
              id="profile-report-reason"
              value={reason}
              onChange={(event) => {
                if (event.target.value.length <= REASON_MAX) {
                  setReason(event.target.value);
                }
              }}
              placeholder={t('reasonPlaceholder')}
              maxLength={REASON_MAX}
              rows={4}
              disabled={submitting}
            />
            <p
              className={cn(
                'text-xs transition-colors',
                reasonOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {reasonHint}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="profile-report-attach" className="flex items-baseline gap-2">
                {t('attachLabel')}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('attachOptional')}
                </span>
              </Label>
              {attachments.length > 0 ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t('attachCountSummary', { count: attachments.length })}
                </span>
              ) : null}
            </div>

            <FileDropZone
              inputId="profile-report-attach"
              multiple
              accept={ACCEPTED_TYPES}
              disabled={submitting}
              icon={<UploadCloudIcon className="size-5" />}
              prompt={t('attachDropzone')}
              description={t('attachAction')}
              hint={t('attachHint', { maxFiles: MAX_FILES, maxSize: MAX_FILE_SIZE_MB })}
              onFiles={addFiles}
              className="py-6"
            />

            <AnimatePresence initial={false}>
              {attachments.length > 0 ? (
                <motion.ul
                  key="attachments"
                  initial={reduce ? undefined : { opacity: 0, y: -4 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-1.5"
                >
                  <AnimatePresence initial={false}>
                    {attachments.map((attachment) => {
                      const isImage = attachment.file.type.startsWith('image/');
                      return (
                        <motion.li
                          key={attachment.id}
                          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                          exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                          className="flex items-center gap-2.5 rounded-lg border border-input bg-background px-2.5 py-2"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-md',
                              isImage
                                ? 'bg-brand/10 text-brand'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {isImage ? (
                              <ImageIcon className="size-4" />
                            ) : (
                              <FileIcon className="size-4" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="truncate text-sm font-medium text-foreground">
                              {attachment.file.name}
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {formatBytes(attachment.file.size)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            disabled={submitting}
                            aria-label={t('attachRemove')}
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XIcon className="size-4" />
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!canSubmit}
            >
              <FlagIcon />
              {submitting ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
