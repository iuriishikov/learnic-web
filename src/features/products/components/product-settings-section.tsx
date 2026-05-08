'use client';

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  HistoryIcon,
  LoaderCircleIcon,
  PackagePlusIcon,
  RotateCcwIcon,
  RocketIcon,
  Trash2Icon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  type ChangeEvent as ReactChangeEvent,
  type FormEvent as ReactFormEvent,
  useState,
} from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { TextareaAutosize } from '@/shared/ui/textarea-autosize';

import {
  type CourseReleaseKind,
  type CourseReleaseSummary,
  type CourseReleaseVersion,
} from '../api/releases';
import {
  CourseReleasesError,
  useCourseReleases,
  useCreateCourseReleaseMutation,
  useResetCourseDraftMutation,
} from '../api/use-course-releases';
import {
  useArchiveProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useUnarchiveProductMutation,
} from '../api/use-product-mutations';
import type { Product, ProductStatus } from '../model/types';

const NOTES_MAX = 5000;

type ProductSettingsSectionProps = {
  product: Product;
};

export function ProductSettingsSection({
  product,
}: ProductSettingsSectionProps) {
  const t = useTranslations('teach-products.editor.settings');
  const reduceMotion = useReducedMotion();
  const isCourse = product.type === 'course';

  return (
    <motion.div
      key="settings-section"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-8"
    >
      <header className="flex flex-col gap-1 px-1">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('description')}
        </p>
      </header>

      <StatusBlock product={product} />
      {isCourse ? <ReleasesBlock product={product} /> : null}
      <DangerZone product={product} />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status block                                                               */
/* -------------------------------------------------------------------------- */

function StatusBlock({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.status');
  const tStatus = useTranslations('teach-products.status');
  const formatter = useFormatter();
  const isCourse = product.type === 'course';
  const archive = useArchiveProductMutation(product.id);
  const unarchive = useUnarchiveProductMutation(product.id);
  const publish = usePublishProductMutation(product.id);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const router = useRouter();

  const onArchive = () => {
    archive.mutate(undefined, {
      onSuccess: () => {
        setConfirmArchive(false);
        router.replace('/products');
      },
    });
  };

  const onUnarchive = () => {
    unarchive.mutate();
  };

  return (
    <Block title={t('title')} description={t('description')}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-foreground/10',
            statusToneClass(product.status),
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {tStatus(product.status)}
        </span>
        {product.publishedAt ? (
          <span className="text-xs text-muted-foreground">
            {t('publishedAt', {
              date: formatter.dateTime(new Date(product.publishedAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            })}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isCourse && product.status === 'draft' ? (
          <Button
            type="button"
            size="sm"
            onClick={() => publish.mutate()}
            disabled={publish.isPending}
            className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {publish.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <RocketIcon className="size-4" />
            )}
            {t('publish')}
          </Button>
        ) : null}
        {product.status === 'archived' ? (
          <Button
            type="button"
            size="sm"
            onClick={onUnarchive}
            disabled={unarchive.isPending}
            className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {unarchive.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <ArchiveRestoreIcon className="size-4" />
            )}
            {unarchive.isPending ? t('unarchiving') : t('unarchive')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmArchive(true)}
            disabled={
              archive.isPending ||
              (isCourse && product.status === 'draft')
            }
            className="gap-1.5"
          >
            <ArchiveIcon className="size-4" />
            {t('archive')}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('archiveConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('archiveConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archive.isPending}>
              {t('archiveConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={archive.isPending}
              onClick={onArchive}
            >
              {archive.isPending
                ? t('archiveConfirm.confirming')
                : t('archiveConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Block>
  );
}

/* -------------------------------------------------------------------------- */
/* Releases block (course only)                                               */
/* -------------------------------------------------------------------------- */

function ReleasesBlock({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.releases');
  const isCourse = product.type === 'course';
  const query = useCourseReleases(product.id, isCourse);
  const create = useCreateCourseReleaseMutation(product.id);
  const reset = useResetCourseDraftMutation(product.id);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<CourseReleaseSummary | null>(
    null,
  );

  const onCreate = (kind: CourseReleaseKind, notes: string | null) => {
    create.mutate(
      { kind, notes },
      {
        onSuccess: () => setCreateOpen(false),
      },
    );
  };

  const onReset = () => {
    if (!resetTarget) return;
    reset.mutate(
      { releaseId: resetTarget.id },
      {
        onSuccess: () => setResetTarget(null),
      },
    );
  };

  return (
    <Block title={t('title')} description={t('description')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t('countLabel', { count: query.data?.length ?? 0 })}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={create.isPending}
          className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <PackagePlusIcon className="size-4" />
          {t('createCta')}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {query.isPending ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : query.isError ? (
          <ReleasesLoadError
            reason={
              query.error instanceof CourseReleasesError
                ? query.error.reason
                : 'unknown'
            }
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : query.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {t('empty.title')}
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          query.data.map((release) => (
            <ReleaseRow
              key={release.id}
              release={release}
              onResetRequest={() => setResetTarget(release)}
              isResetPending={reset.isPending}
            />
          ))
        )}
      </div>

      <CreateReleaseDialog
        open={createOpen}
        onOpenChange={(open) => !create.isPending && setCreateOpen(open)}
        onSubmit={onCreate}
        isSubmitting={create.isPending}
      />

      <AlertDialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open && !reset.isPending) setResetTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetTarget
                ? t('resetConfirm.title', {
                    version: formatVersion(resetTarget.version),
                  })
                : t('resetConfirm.title', { version: '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('resetConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reset.isPending}>
              {t('resetConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={reset.isPending}
              onClick={onReset}
            >
              {reset.isPending
                ? t('resetConfirm.confirming')
                : t('resetConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Block>
  );
}

function ReleaseRow({
  release,
  onResetRequest,
  isResetPending,
}: {
  release: CourseReleaseSummary;
  onResetRequest: () => void;
  isResetPending: boolean;
}) {
  const t = useTranslations('teach-products.editor.settings.releases');
  const formatter = useFormatter();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">
            v{formatVersion(release.version)}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-foreground/10',
              kindToneClass(release.kind),
            )}
          >
            {t(`kind.${release.kind}`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatter.dateTime(new Date(release.releasedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
        {release.notes ? (
          <p className="text-sm leading-snug text-muted-foreground">
            {release.notes}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onResetRequest}
        disabled={isResetPending}
        className="shrink-0 gap-1.5"
      >
        <RotateCcwIcon className="size-4" />
        {t('resetTo')}
      </Button>
    </div>
  );
}

function ReleasesLoadError({
  reason,
  onRetry,
  isRetrying,
}: {
  reason: 'forbidden' | 'not-found' | 'not-a-course' | 'unauthorized' | 'network' | 'unknown';
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const t = useTranslations('teach-products.editor.settings.releases.error');
  return (
    <div
      role="alert"
      className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center"
    >
      <p className="text-sm font-medium text-foreground">{t('title')}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">
        {t('description')}
      </p>
      {reason !== 'forbidden' && reason !== 'not-a-course' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-3 gap-1.5"
        >
          <HistoryIcon className={cn('size-3.5', isRetrying && 'animate-spin')} />
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

function CreateReleaseDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (kind: CourseReleaseKind, notes: string | null) => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations('teach-products.editor.settings.releases.create');
  const [kind, setKind] = useState<CourseReleaseKind>('minor');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNotes = notes.trim();
    onSubmit(kind, trimmedNotes.length > 0 ? trimmedNotes : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <span
              id="release-kind-label"
              className="px-1 text-sm font-medium text-foreground"
            >
              {t('kindLabel')}
            </span>
            <div
              role="radiogroup"
              aria-labelledby="release-kind-label"
              className="flex flex-col gap-2"
            >
              {(['patch', 'minor', 'major'] as const).map((option) => (
                <KindOption
                  key={option}
                  value={option}
                  checked={kind === option}
                  onSelect={() => setKind(option)}
                  label={t(`kind.${option}.label`)}
                  description={t(`kind.${option}.description`)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="release-notes"
              className="px-1 text-sm font-medium text-foreground"
            >
              {t('notesLabel')}
            </label>
            <TextareaAutosize
              id="release-notes"
              value={notes}
              onChange={(e: ReactChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              maxLength={NOTES_MAX}
              placeholder={t('notesPlaceholder')}
              className="min-h-[88px] text-sm"
            />
            <p className="px-1 text-xs leading-snug text-muted-foreground">
              {t('notesHint')}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KindOption({
  value,
  checked,
  onSelect,
  label,
  description,
}: {
  value: CourseReleaseKind;
  checked: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors',
        checked
          ? 'border-brand bg-brand/5 ring-1 ring-brand/40'
          : 'hover:bg-muted/40',
      )}
    >
      <input
        type="radio"
        name="release-kind"
        value={value}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 cursor-pointer accent-brand"
      />
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Danger zone                                                                */
/* -------------------------------------------------------------------------- */

function DangerZone({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.danger');
  const router = useRouter();
  const deleteMutation = useDeleteProductMutation(product.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canDelete = product.status === 'draft';

  const onDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        router.replace('/products');
      },
    });
  };

  return (
    <Block
      title={t('title')}
      description={t('description')}
      tone="danger"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm leading-snug text-muted-foreground">
          {canDelete ? t('deleteHint') : t('deleteUnavailable')}
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={!canDelete || deleteMutation.isPending}
          className="gap-1.5"
        >
          <Trash2Icon className="size-4" />
          {t('delete')}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('deleteConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={onDelete}
            >
              {deleteMutation.isPending
                ? t('deleteConfirm.confirming')
                : t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Block>
  );
}

/* -------------------------------------------------------------------------- */
/* Block primitive                                                            */
/* -------------------------------------------------------------------------- */

function Block({
  title,
  description,
  tone = 'default',
  children,
}: {
  title: string;
  description: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-background p-5',
        tone === 'danger'
          ? 'border-destructive/40'
          : 'border-border',
      )}
    >
      <header className="mb-4 flex flex-col gap-1">
        <h3
          className={cn(
            'font-heading text-base font-semibold tracking-tight',
            tone === 'danger' ? 'text-destructive' : 'text-foreground',
          )}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatVersion(version: CourseReleaseVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function statusToneClass(status: ProductStatus): string {
  switch (status) {
    case 'published':
      return 'bg-brand/10 text-brand';
    case 'draft':
      return 'bg-muted text-muted-foreground';
    case 'archived':
      return 'bg-foreground/10 text-foreground/70';
    case 'banned':
      return 'bg-destructive/10 text-destructive';
  }
}

function kindToneClass(kind: CourseReleaseKind): string {
  switch (kind) {
    case 'major':
      return 'bg-brand/10 text-brand';
    case 'minor':
      return 'bg-foreground/[0.04] text-foreground/80';
    case 'patch':
      return 'bg-muted text-muted-foreground';
  }
}
