'use client';

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  GlobeIcon,
  HistoryIcon,
  LoaderCircleIcon,
  LockIcon,
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
  type ReactNode,
  useState,
} from 'react';

import { useAuth } from '@/shared/auth';
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
import { Textarea } from '@/shared/ui/textarea';

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
  useChangeProductVisibilityMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useUnarchiveProductMutation,
} from '../api/use-product-mutations';
import { useProductPermissions } from '../api/use-product-permissions';
import type {
  Product,
  ProductStatus,
  ProductVisibility,
} from '../model/types';
import { EditorRow, EditorSection } from './editor-row';

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
    >
      <EditorSection title={t('title')} description={t('description')}>
        <StatusRow product={product} />
        <VisibilityRow product={product} />
        {isCourse ? <ReleasesRow product={product} /> : null}
        <DangerRow product={product} />
      </EditorSection>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status row                                                                 */
/* -------------------------------------------------------------------------- */

function StatusRow({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.status');
  const tEditor = useTranslations('teach-products.editor');
  const tStatus = useTranslations('teach-products.status');
  const formatter = useFormatter();
  const isCourse = product.type === 'course';
  const archive = useArchiveProductMutation(product.id);
  const unarchive = useUnarchiveProductMutation(product.id);
  const publish = usePublishProductMutation(product.id);
  const perms = useProductPermissions(product.id);
  const insufficientTitle = tEditor('insufficientPermissions');
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
    <EditorRow label={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
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

        <div className="flex flex-wrap gap-2">
          {!isCourse && product.status === 'draft' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => publish.mutate()}
              disabled={publish.isPending || !perms.canPublish}
              title={!perms.canPublish ? insufficientTitle : undefined}
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
              disabled={unarchive.isPending || !perms.canArchive}
              title={!perms.canArchive ? insufficientTitle : undefined}
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
                (isCourse && product.status === 'draft') ||
                !perms.canArchive
              }
              title={!perms.canArchive ? insufficientTitle : undefined}
              className="gap-1.5"
            >
              <ArchiveIcon className="size-4" />
              {t('archive')}
            </Button>
          )}
        </div>
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
    </EditorRow>
  );
}

/* -------------------------------------------------------------------------- */
/* Visibility row (owner only)                                                */
/* -------------------------------------------------------------------------- */

function VisibilityRow({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.visibility');
  const currentUserId = useAuth().user?.oid ?? null;
  const isOwner =
    currentUserId !== null && currentUserId === product.author.id;
  const mutation = useChangeProductVisibilityMutation(product.id);

  // Owner-only — collaborators (even with every permission) can't see or
  // toggle this. The backend enforces the same rule (403 NotResourceOwner);
  // hiding the control just avoids surfacing an action that would fail.
  if (!isOwner) return null;

  const choose = (visibility: ProductVisibility) => {
    // Single-select: skip re-picking the active option (no-op PATCH).
    if (visibility !== product.visibility) {
      mutation.mutate({ visibility });
    }
  };

  return (
    <EditorRow label={t('title')} description={t('description')}>
      <div
        role="radiogroup"
        aria-label={t('title')}
        className="flex flex-col gap-2.5"
      >
        <VisibilityOption
          icon={<GlobeIcon className="size-4" />}
          title={t('publicOption')}
          description={t('publicHint')}
          selected={product.visibility === 'public'}
          disabled={mutation.isPending}
          onSelect={() => choose('public')}
        />
        <VisibilityOption
          icon={<LockIcon className="size-4" />}
          title={t('privateOption')}
          description={t('privateHint')}
          selected={product.visibility === 'private'}
          disabled={mutation.isPending}
          onSelect={() => choose('private')}
        />
      </div>
    </EditorRow>
  );
}

function VisibilityOption({
  icon,
  title,
  description,
  selected,
  disabled,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left outline-none transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        selected
          ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
          : 'border-border hover:border-foreground/15 hover:bg-muted/40',
        disabled && 'opacity-60',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
      {/* Visual single-select indicator, mirrors the shadcn Checkbox checked
          state. Decorative (aria-hidden) — selection state lives on the
          enclosing role="radio" button. */}
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
          selected
            ? 'border-brand bg-brand text-brand-foreground'
            : 'border-input',
        )}
      >
        {selected ? <CheckIcon className="size-3.5" /> : null}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Releases row (course only)                                                 */
/* -------------------------------------------------------------------------- */

function ReleasesRow({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.settings.releases');
  const tEditor = useTranslations('teach-products.editor');
  const isCourse = product.type === 'course';
  const query = useCourseReleases(product.id, isCourse);
  const create = useCreateCourseReleaseMutation(product.id);
  const reset = useResetCourseDraftMutation(product.id);
  const perms = useProductPermissions(product.id);
  const insufficientTitle = tEditor('insufficientPermissions');

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
    <EditorRow label={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t('countLabel', { count: query.data?.length ?? 0 })}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={create.isPending || !perms.canManageReleases}
            title={!perms.canManageReleases ? insufficientTitle : undefined}
            className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <PackagePlusIcon className="size-4" />
            {t('createCta')}
          </Button>
        </div>

        <div className="@container/release-list flex flex-col gap-2">
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
            <div className="rounded-xl bg-muted/40 px-4 py-6">
              <p className="text-sm font-medium text-foreground">
                {t('empty.title')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
                canManageReleases={perms.canManageReleases}
                insufficientPermissionsTitle={insufficientTitle}
              />
            ))
          )}
        </div>
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
    </EditorRow>
  );
}

function ReleaseRow({
  release,
  onResetRequest,
  isResetPending,
  canManageReleases,
  insufficientPermissionsTitle,
}: {
  release: CourseReleaseSummary;
  onResetRequest: () => void;
  isResetPending: boolean;
  canManageReleases: boolean;
  insufficientPermissionsTitle: string;
}) {
  const t = useTranslations('teach-products.editor.settings.releases');
  const formatter = useFormatter();
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-4 shadow-xs transition-colors hover:border-foreground/15 @lg/release-list:flex-row @lg/release-list:items-center @lg/release-list:justify-between @lg/release-list:gap-4">
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
          <span className="whitespace-nowrap text-xs text-muted-foreground">
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
        disabled={isResetPending || !canManageReleases}
        title={!canManageReleases ? insufficientPermissionsTitle : undefined}
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
  const isForbidden = reason === 'forbidden';
  const titleKey = isForbidden ? 'forbiddenTitle' : 'title';
  const descriptionKey = isForbidden ? 'forbiddenDescription' : 'description';
  const showRetry = !isForbidden && reason !== 'not-a-course';
  return (
    <div role="alert" className="rounded-xl bg-muted/40 px-4 py-4">
      <p className="text-sm font-medium text-foreground">{t(titleKey)}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t(descriptionKey)}
      </p>
      {showRetry ? (
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
            <Textarea
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
/* Danger row                                                                 */
/* -------------------------------------------------------------------------- */

function DangerRow({ product }: { product: Product }) {
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
    <EditorRow
      label={t('title')}
      description={t('description')}
      tone="danger"
    >
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
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
    </EditorRow>
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
