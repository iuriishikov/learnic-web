'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileIcon,
  GripVerticalIcon,
  Loader2Icon,
  RefreshCwIcon,
  UploadCloudIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import { VideoPlayer } from '@/shared/ui/video-player';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib/utils';

import {
  type CollageItemDraft,
  useAddFileBlockMutation,
  useAddPhotoCollageBlockMutation,
  useAddVideoFileBlockMutation,
} from '../api/use-course-mutations';
import {
  BLOCK_TITLE_MAX_LEN,
  LESSON_COLLAGE_ITEM_MAX_BYTES,
  LESSON_FILE_BLOCK_MAX_BYTES,
  LESSON_VIDEO_BLOCK_MAX_BYTES,
  PHOTO_COLLAGE_CAPTION_MAX_LEN,
  PHOTO_COLLAGE_MAX_ITEMS,
  PHOTO_COLLAGE_MIN_ITEMS,
  type FileBlock,
  type VideoFileBlock,
} from '../model/draft';

const _BYTES_PER_MB = 1024 * 1024;
const FILE_BLOCK_MAX_MB = LESSON_FILE_BLOCK_MAX_BYTES / _BYTES_PER_MB;
const VIDEO_BLOCK_MAX_MB = LESSON_VIDEO_BLOCK_MAX_BYTES / _BYTES_PER_MB;
const COLLAGE_ITEM_MAX_MB = LESSON_COLLAGE_ITEM_MAX_BYTES / _BYTES_PER_MB;

/* -------------------------------------------------------------------------- */
/* Viewers — read-only renders inside the lesson-blocks ladder                */
/* -------------------------------------------------------------------------- */

export function FileBlockView({ block }: { block: FileBlock }) {
  const t = useTranslations('teach-products.editor.fileBlock');
  if (block.file === null) {
    return <MissingFilePlaceholder kind="file" />;
  }
  return (
    <a
      href={block.file.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10"
      >
        <FileIcon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium leading-tight text-foreground">
          {block.title ?? t('defaultTitle')}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {t('downloadHint')}
        </span>
      </span>
    </a>
  );
}

export function VideoFileBlockView({ block }: { block: VideoFileBlock }) {
  if (block.file === null) {
    return <MissingFilePlaceholder kind="video_file" />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <VideoPlayer
        src={block.file.url}
        ariaLabel={block.title ?? undefined}
        className="aspect-video w-full"
      />
      {block.title ? (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-foreground">
          <VideoIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{block.title}</span>
        </div>
      ) : null}
    </div>
  );
}

function MissingFilePlaceholder({
  kind,
}: {
  kind: 'file' | 'video_file';
}) {
  const t = useTranslations('teach-products.editor.fileBlock');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
      <FileIcon className="size-4 shrink-0" />
      <span>{t(`missing.${kind}`)}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

export type AddFileBackedDialogKind = 'file' | 'video_file' | 'photo_collage';

type CommonAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
};

function failureToastKey(reason: string): string {
  switch (reason) {
    case 'quota-exceeded':
      return 'quotaExceeded';
    case 'wrong-content-type':
      return 'wrongContentType';
    case 'unauthorized':
      return 'unauthorized';
    case 'forbidden':
      return 'forbidden';
    case 'not-found':
      return 'notFound';
    case 'network':
      return 'network';
    case 'validation':
      return 'validation';
    default:
      return 'unknown';
  }
}

function formatBytes(bytes: number, locale = 'ru-RU'): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }
  return `${value.toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} ${units[unitIdx]}`;
}

/** Manage an object-URL preview for a `File`, revoking it on change/unmount. */
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

/** Pair each `File` with a stable preview URL; revoke on remove/unmount. */
function useObjectUrls(files: ReadonlyArray<File>): ReadonlyArray<string> {
  // Track URLs by File identity so we don't recreate (and rev/re-create) for
  // files that survived a setState pass.
  const map = useRef(new Map<File, string>());
  useEffect(() => {
    return () => {
      for (const url of map.current.values()) URL.revokeObjectURL(url);
      map.current.clear();
    };
  }, []);
  return useMemo(() => {
    const next = new Map<File, string>();
    for (const file of files) {
      const existing = map.current.get(file);
      if (existing) {
        next.set(file, existing);
      } else {
        next.set(file, URL.createObjectURL(file));
      }
    }
    for (const [file, url] of map.current.entries()) {
      if (!next.has(file)) URL.revokeObjectURL(url);
    }
    map.current = next;
    return files.map((f) => next.get(f) ?? '');
  }, [files]);
}

/* -------------------------------------------------------------------------- */
/* DropZone — drag-and-drop affordance + native picker                        */
/* -------------------------------------------------------------------------- */

type DropZoneProps = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Lucide icon node for the empty state. */
  icon: ReactNode;
  /** Bold prompt above the secondary hint. */
  prompt: string;
  /** Smaller hint with the format / size constraint. */
  hint?: string;
  onFiles: (files: File[]) => void;
};

function DropZone({
  accept,
  multiple,
  disabled,
  icon,
  prompt,
  hint,
  onFiles,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const reduceMotion = useReducedMotion();

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handlePick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    if (arr.length === 0) return;
    onFiles(arr);
    // Reset native value so picking the same path again still fires change.
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    // Ignore enters into children — only flip off when leaving the host.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handlePick(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handlePick(e.target.files)}
      />
      <motion.button
        type="button"
        onClick={openPicker}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={disabled}
        whileHover={reduceMotion || disabled ? undefined : { scale: 1.005 }}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.995 }}
        animate={{ scale: dragOver && !reduceMotion ? 1.01 : 1 }}
        transition={{ duration: 0.15 }}
        aria-label={prompt}
        className={cn(
          'group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && dragOver
            ? 'border-brand bg-brand/5'
            : 'border-border bg-muted/10 hover:border-brand/50 hover:bg-muted/20',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-12 items-center justify-center rounded-full bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10 transition-colors',
            !disabled && dragOver && 'bg-brand/10 text-brand ring-brand/30',
          )}
        >
          {icon}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{prompt}</span>
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </motion.button>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* PreviewCard — selected file with name / size / replace button              */
/* -------------------------------------------------------------------------- */

type FilePreviewCardProps = {
  file: File;
  onReplace: () => void;
  /** Optional child slot (video preview, image preview, etc.). */
  preview?: ReactNode;
  /** Lucide icon for the fallback (no preview slot). */
  fallbackIcon: ReactNode;
  replaceLabel: string;
  disabled?: boolean;
};

function FilePreviewCard({
  file,
  onReplace,
  preview,
  fallbackIcon,
  replaceLabel,
  disabled,
}: FilePreviewCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      {preview ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/10">
          {preview}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        {!preview ? (
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10"
          >
            {fallbackIcon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReplace}
          disabled={disabled}
          className="gap-1.5"
        >
          <RefreshCwIcon className="size-3.5" />
          <span className="text-xs">{replaceLabel}</span>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog shell — shared chrome (header / body / footer)                      */
/* -------------------------------------------------------------------------- */

type FileBlockDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  uploadingLabel: string;
  canSubmit: boolean;
  isPending: boolean;
  onSubmit: () => void;
  size?: 'sm' | 'lg';
  children: ReactNode;
};

function FileBlockDialogShell({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  uploadingLabel,
  canSubmit,
  isPending,
  onSubmit,
  size = 'sm',
  children,
}: FileBlockDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0',
          size === 'sm' ? 'sm:max-w-[520px]' : 'sm:max-w-[720px]',
        )}
      >
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit} className="gap-1.5">
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {uploadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* AddFileBlockDialog                                                         */
/* -------------------------------------------------------------------------- */

export function AddFileBlockDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
}: CommonAddDialogProps) {
  const t = useTranslations('teach-products.editor.addFileDialog');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const mutation = useAddFileBlockMutation(courseId);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const titleInputId = useId();

  const reset = () => {
    setFile(null);
    setTitle('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async () => {
    if (!file) return;
    const result = await mutation.mutateAsync({
      lessonId,
      file,
      title: title.trim() || null,
    });
    if (result.ok) {
      handleOpenChange(false);
      return;
    }
    if (result.reason === 'quota-exceeded' && result.quota) {
      notify.error(
        tToast('quotaExceeded', {
          used: formatBytes(result.quota.usedBytes),
          attempted: formatBytes(result.quota.attemptedBytes),
          limit: formatBytes(result.quota.limitBytes),
          plan: result.quota.planCode,
        }),
      );
      return;
    }
    notify.error(tToast(failureToastKey(result.reason)));
  };

  return (
    <FileBlockDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={t('title')}
      description={t('description')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      uploadingLabel={t('uploading')}
      canSubmit={file != null && !mutation.isPending}
      isPending={mutation.isPending}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-5">
        {file == null ? (
          <DropZone
            icon={<UploadCloudIcon className="size-6" />}
            prompt={t('dropPrompt')}
            hint={t('dropHint', { maxMb: FILE_BLOCK_MAX_MB })}
            disabled={mutation.isPending}
            onFiles={(files) => {
              const picked = files[0];
              if (!picked) return;
              if (picked.size > LESSON_FILE_BLOCK_MAX_BYTES) {
                notify.error(
                  tToast('fileTooLargeClient', {
                    name: picked.name,
                    maxMb: FILE_BLOCK_MAX_MB,
                  }),
                );
                return;
              }
              setFile(picked);
            }}
          />
        ) : (
          <FilePreviewCard
            file={file}
            onReplace={() => setFile(null)}
            fallbackIcon={<FileIcon className="size-5" />}
            replaceLabel={t('replace')}
            disabled={mutation.isPending}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={titleInputId}>{t('titleLabel')}</Label>
          <Input
            id={titleInputId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={BLOCK_TITLE_MAX_LEN}
            placeholder={t('titlePlaceholder')}
            disabled={mutation.isPending}
          />
        </div>
      </div>
    </FileBlockDialogShell>
  );
}

/* -------------------------------------------------------------------------- */
/* AddVideoFileBlockDialog                                                    */
/* -------------------------------------------------------------------------- */

export function AddVideoFileBlockDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
}: CommonAddDialogProps) {
  const t = useTranslations('teach-products.editor.addVideoFileDialog');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const mutation = useAddVideoFileBlockMutation(courseId);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const titleInputId = useId();
  const previewUrl = useObjectUrl(file);

  const reset = () => {
    setFile(null);
    setTitle('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async () => {
    if (!file) return;
    const result = await mutation.mutateAsync({
      lessonId,
      file,
      title: title.trim() || null,
    });
    if (result.ok) {
      handleOpenChange(false);
      return;
    }
    if (result.reason === 'quota-exceeded' && result.quota) {
      notify.error(
        tToast('quotaExceeded', {
          used: formatBytes(result.quota.usedBytes),
          attempted: formatBytes(result.quota.attemptedBytes),
          limit: formatBytes(result.quota.limitBytes),
          plan: result.quota.planCode,
        }),
      );
      return;
    }
    if (result.reason === 'wrong-content-type') {
      notify.error(tToast('wrongContentTypeVideo'));
      return;
    }
    notify.error(tToast(failureToastKey(result.reason)));
  };

  return (
    <FileBlockDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={t('title')}
      description={t('description')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      uploadingLabel={t('uploading')}
      canSubmit={file != null && !mutation.isPending}
      isPending={mutation.isPending}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-5">
        {file == null ? (
          <DropZone
            icon={<VideoIcon className="size-6" />}
            accept="video/*"
            prompt={t('dropPrompt')}
            hint={t('dropHint', { maxMb: VIDEO_BLOCK_MAX_MB })}
            disabled={mutation.isPending}
            onFiles={(files) => {
              const picked = files[0];
              if (!picked) return;
              if (picked.size > LESSON_VIDEO_BLOCK_MAX_BYTES) {
                notify.error(
                  tToast('fileTooLargeClient', {
                    name: picked.name,
                    maxMb: VIDEO_BLOCK_MAX_MB,
                  }),
                );
                return;
              }
              setFile(picked);
            }}
          />
        ) : (
          <FilePreviewCard
            file={file}
            onReplace={() => setFile(null)}
            fallbackIcon={<VideoIcon className="size-5" />}
            preview={
              previewUrl ? (
                <VideoPlayer
                  key={previewUrl}
                  src={previewUrl}
                  className="aspect-video w-full"
                />
              ) : null
            }
            replaceLabel={t('replace')}
            disabled={mutation.isPending}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={titleInputId}>{t('titleLabel')}</Label>
          <Input
            id={titleInputId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={BLOCK_TITLE_MAX_LEN}
            placeholder={t('titlePlaceholder')}
            disabled={mutation.isPending}
          />
        </div>
      </div>
    </FileBlockDialogShell>
  );
}

/* -------------------------------------------------------------------------- */
/* AddPhotoCollageBlockDialog                                                 */
/* -------------------------------------------------------------------------- */

type DraftItem = CollageItemDraft & { id: string };

function _newDraftId(): string {
  return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

export function AddPhotoCollageBlockDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
}: CommonAddDialogProps) {
  const t = useTranslations('teach-products.editor.addCollageDialog');
  const tToast = useTranslations('teach-products.editor.toast');
  const tBlock = useTranslations('teach-products.editor.collageBlock');
  const notify = useNotify();
  const mutation = useAddPhotoCollageBlockMutation(courseId);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [title, setTitle] = useState('');
  const titleInputId = useId();

  const previewUrls = useObjectUrls(items.map((it) => it.file));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const reset = () => {
    setItems([]);
    setTitle('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFilesPicked = useCallback(
    (files: File[]) => {
      setItems((prev) => {
        const remaining = PHOTO_COLLAGE_MAX_ITEMS - prev.length;
        if (remaining <= 0) return prev;
        const accepted: File[] = [];
        for (const f of files.slice(0, remaining)) {
          if (f.size > LESSON_COLLAGE_ITEM_MAX_BYTES) {
            notify.error(
              tToast('fileTooLargeClient', {
                name: f.name,
                maxMb: COLLAGE_ITEM_MAX_MB,
              }),
            );
            continue;
          }
          accepted.push(f);
        }
        if (accepted.length === 0) return prev;
        return [
          ...prev,
          ...accepted.map((f) => ({
            id: _newDraftId(),
            file: f,
            caption: '',
          })),
        ];
      });
    },
    [notify, tToast],
  );

  const updateCaption = (id: string, caption: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item)),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((it) => it.id === active.id);
      const newIndex = prev.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const submit = async () => {
    if (items.length < PHOTO_COLLAGE_MIN_ITEMS) return;
    if (items.length > PHOTO_COLLAGE_MAX_ITEMS) return;
    const result = await mutation.mutateAsync({
      lessonId,
      items: items.map((it) => ({
        file: it.file,
        caption: it.caption?.trim() || null,
      })),
      title: title.trim() || null,
    });
    if (result.ok) {
      handleOpenChange(false);
      return;
    }
    if (result.reason === 'quota-exceeded' && result.quota) {
      notify.error(
        tToast('quotaExceeded', {
          used: formatBytes(result.quota.usedBytes),
          attempted: formatBytes(result.quota.attemptedBytes),
          limit: formatBytes(result.quota.limitBytes),
          plan: result.quota.planCode,
        }),
      );
      return;
    }
    if (result.reason === 'wrong-content-type') {
      notify.error(tToast('wrongContentTypeImage'));
      return;
    }
    notify.error(tToast(failureToastKey(result.reason)));
  };

  const canAddMore = items.length < PHOTO_COLLAGE_MAX_ITEMS;
  const canSubmit =
    items.length >= PHOTO_COLLAGE_MIN_ITEMS &&
    items.length <= PHOTO_COLLAGE_MAX_ITEMS &&
    !mutation.isPending;
  const totalSize = items.reduce((sum, it) => sum + it.file.size, 0);
  const itemIds = items.map((it) => it.id);

  return (
    <FileBlockDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      title={t('title')}
      description={t('description', {
        min: PHOTO_COLLAGE_MIN_ITEMS,
        max: PHOTO_COLLAGE_MAX_ITEMS,
      })}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      uploadingLabel={t('uploading')}
      canSubmit={canSubmit}
      isPending={mutation.isPending}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={titleInputId}>{t('titleLabel')}</Label>
          <Input
            id={titleInputId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={BLOCK_TITLE_MAX_LEN}
            placeholder={t('titlePlaceholder')}
            disabled={mutation.isPending}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <Label className="text-sm font-medium">
              {t('photosLabel', { count: items.length })}
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {items.length} / {PHOTO_COLLAGE_MAX_ITEMS}
              {items.length > 0 ? ` · ${formatBytes(totalSize)}` : null}
            </span>
          </div>

          <DndContext
            id="add-collage-dialog-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((item, idx) => (
                  <CollageDraftCard
                    key={item.id}
                    item={item}
                    previewUrl={previewUrls[idx] ?? ''}
                    disabled={mutation.isPending}
                    onRemove={() => removeItem(item.id)}
                    onCaptionChange={(caption) =>
                      updateCaption(item.id, caption)
                    }
                    dragLabel={t('dragItem')}
                    removeLabel={t('removeItem')}
                    captionPlaceholder={t('captionPlaceholder')}
                  />
                ))}
                {canAddMore ? (
                  <li>
                    <CollageDialogUploadTile
                      disabled={mutation.isPending}
                      onFiles={onFilesPicked}
                      promptBold={tBlock('uploadPromptBold')}
                      promptRest={tBlock('uploadPromptRest')}
                      hint={tBlock('uploadHint', {
                        maxMb: COLLAGE_ITEM_MAX_MB,
                      })}
                    />
                  </li>
                ) : null}
              </ul>
            </SortableContext>
          </DndContext>

          {!canAddMore ? (
            <p className="text-center text-xs text-muted-foreground">
              {t('maxReached', { max: PHOTO_COLLAGE_MAX_ITEMS })}
            </p>
          ) : null}
        </div>
      </div>
    </FileBlockDialogShell>
  );
}

type CollageDraftCardProps = {
  item: DraftItem;
  previewUrl: string;
  disabled: boolean;
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
  dragLabel: string;
  removeLabel: string;
  captionPlaceholder: string;
};

function CollageDraftCard({
  item,
  previewUrl,
  disabled,
  onRemove,
  onCaptionChange,
  dragLabel,
  removeLabel,
  captionPlaceholder,
}: CollageDraftCardProps) {
  const reduceMotion = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group/draft flex flex-col gap-2 rounded-xl border border-border bg-card p-2',
        isDragging && 'opacity-90 shadow-lg',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted/40">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={item.caption || item.file.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : null}
        <button
          type="button"
          {...attributes}
          {...(disabled ? {} : listeners)}
          disabled={disabled}
          aria-label={dragLabel}
          className={cn(
            'absolute left-2 top-2 flex size-7 touch-none items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/draft:opacity-100',
            !disabled && 'cursor-grab active:cursor-grabbing',
            disabled && 'cursor-not-allowed opacity-40',
            isDragging && 'cursor-grabbing opacity-100',
          )}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={removeLabel}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/draft:opacity-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-background/85 disabled:hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <Input
        value={item.caption ?? ''}
        onChange={(e) => onCaptionChange(e.target.value)}
        maxLength={PHOTO_COLLAGE_CAPTION_MAX_LEN}
        placeholder={captionPlaceholder}
        disabled={disabled}
      />
    </motion.li>
  );
}

type CollageDialogUploadTileProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  promptBold: string;
  promptRest: string;
  hint: string;
};

function CollageDialogUploadTile({
  disabled,
  onFiles,
  promptBold,
  promptRest,
  hint,
}: CollageDialogUploadTileProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const pickFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    pickFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        disabled && 'pointer-events-none opacity-60',
        !disabled && dragOver
          ? 'border-brand bg-brand/5'
          : 'border-border bg-card hover:border-brand/50 hover:bg-muted/20',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(e) => pickFiles(e.target.files)}
      />
      <span
        aria-hidden
        className={cn(
          'flex size-10 items-center justify-center rounded-lg bg-background text-foreground ring-1 ring-border transition-colors',
          !disabled && dragOver && 'bg-brand/10 text-brand ring-brand/30',
        )}
      >
        <UploadCloudIcon className="size-5" />
      </span>
      <p className="text-sm leading-snug text-foreground">
        <span className="font-semibold text-brand">{promptBold}</span>
        <span className="text-muted-foreground">{promptRest}</span>
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
