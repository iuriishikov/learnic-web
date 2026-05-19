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
  GripVerticalIcon,
  Loader2Icon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';

import {
  type CollageItemDraft,
  useUpdatePhotoCollageBlockMutation,
} from '../api/use-course-mutations';
import {
  LESSON_COLLAGE_ITEM_MAX_BYTES,
  PHOTO_COLLAGE_CAPTION_MAX_LEN,
  PHOTO_COLLAGE_MAX_ITEMS,
  PHOTO_COLLAGE_MIN_ITEMS,
  type PhotoCollageBlock,
} from '../model/draft';

import type { ApiFile } from '@/shared/types/user';

const _BYTES_PER_MB = 1024 * 1024;
const COLLAGE_ITEM_MAX_MB = LESSON_COLLAGE_ITEM_MAX_BYTES / _BYTES_PER_MB;
const SAVE_DEBOUNCE_MS = 700;

type EditorItem =
  | {
      kind: 'existing';
      id: string;
      apiFile: ApiFile;
      caption: string;
    }
  | {
      kind: 'new';
      id: string;
      file: File;
      previewUrl: string;
      caption: string;
    };

function _newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function _itemsFromBlock(block: PhotoCollageBlock): EditorItem[] {
  // Each non-null file becomes an editable existing item; rows with a
  // null `file` (the backing storage record was reaped) are dropped —
  // the user cannot re-upload a phantom and we don't want a non-editable
  // placeholder mixed into the grid.
  return block.items
    .map((item, idx) => {
      if (!item.file) return null;
      return {
        kind: 'existing' as const,
        id: `${block.id}-existing-${idx}-${item.file.oid}`,
        apiFile: item.file,
        caption: item.caption ?? '',
      };
    })
    .filter((it): it is Extract<EditorItem, { kind: 'existing' }> => it !== null);
}

export type PhotoCollageBlockEditorProps = {
  block: PhotoCollageBlock;
  courseId: string;
  canEditLessons: boolean;
  insufficientPermissionsTitle?: string;
};

export function PhotoCollageBlockEditor({
  block,
  courseId,
  canEditLessons,
  insufficientPermissionsTitle,
}: PhotoCollageBlockEditorProps) {
  const t = useTranslations('teach-products.editor.collageBlock');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const titleId = useId();

  const mutation = useUpdatePhotoCollageBlockMutation(courseId);

  const [items, setItems] = useState<EditorItem[]>(() => _itemsFromBlock(block));
  const [title, setTitle] = useState<string>(block.title ?? '');
  const [isPreparing, setIsPreparing] = useState(false);

  // Track "the local state has unsaved edits" so the server-driven sync
  // effect doesn't clobber them with stale snapshot. Cleared on each
  // successful PATCH.
  const dirtyRef = useRef(false);
  // Cache File objects derived from existing ApiFile URLs so repeated
  // saves don't re-download the same photo every time the user
  // tweaks a caption.
  const fileCacheRef = useRef<Map<string, File>>(new Map());
  // Track preview object-URLs we minted so we can revoke them on remove.
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ items: EditorItem[]; title: string } | null>(
    null,
  );

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    const saveTimerHandle = saveTimerRef;
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
      previewUrls.clear();
      if (saveTimerHandle.current) clearTimeout(saveTimerHandle.current);
    };
  }, []);

  // Reconcile server-driven block changes into local state only when
  // there are no pending unsaved edits — otherwise a draft refresh in
  // the middle of typing would yank captions back.
  useEffect(() => {
    if (dirtyRef.current) return;
    setItems(_itemsFromBlock(block));
    setTitle(block.title ?? '');
  }, [block]);

  /* -------------- existing-file → File hydration (cached) --------------- */

  const hydrateExisting = useCallback(
    async (apiFile: ApiFile): Promise<File> => {
      const cached = fileCacheRef.current.get(apiFile.oid);
      if (cached) return cached;
      const res = await fetch(apiFile.url);
      if (!res.ok) {
        throw new Error(`hydrate-existing-${res.status}`);
      }
      const blob = await res.blob();
      const lastSegment = apiFile.url.split('?')[0].split('/').pop();
      const filename = lastSegment && lastSegment.length > 0
        ? lastSegment
        : `photo-${apiFile.oid}`;
      const file = new File([blob], filename, {
        type: blob.type || apiFile.contentType || 'image/*',
      });
      fileCacheRef.current.set(apiFile.oid, file);
      return file;
    },
    [],
  );

  const buildDrafts = useCallback(
    async (snapshot: EditorItem[]): Promise<CollageItemDraft[]> => {
      return Promise.all(
        snapshot.map(async (item) => {
          const file =
            item.kind === 'new'
              ? item.file
              : await hydrateExisting(item.apiFile);
          return {
            file,
            caption: item.caption.trim() || null,
          };
        }),
      );
    },
    [hydrateExisting],
  );

  /* -------------------------- save scheduling --------------------------- */

  const flushSave = useCallback(async () => {
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return;
    if (pending.items.length < PHOTO_COLLAGE_MIN_ITEMS) {
      // The collage cannot be saved empty — surface the issue and
      // leave the UI in dirty state so the user can recover by
      // re-uploading or restoring an item.
      notify.error(tToast('validation'));
      return;
    }
    try {
      setIsPreparing(true);
      const drafts = await buildDrafts(pending.items);
      setIsPreparing(false);
      const result = await mutation.mutateAsync({
        blockId: block.id,
        items: drafts,
        title: pending.title.trim() || null,
      });
      if (result.ok) {
        dirtyRef.current = false;
        return;
      }
      notify.error(tToast('updateBlockFailed'));
    } catch {
      setIsPreparing(false);
      notify.error(tToast('updateBlockFailed'));
    }
  }, [block.id, buildDrafts, mutation, notify, tToast]);

  const scheduleSave = useCallback(
    (next: { items: EditorItem[]; title: string }, immediate = false) => {
      dirtyRef.current = true;
      pendingSaveRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (immediate) {
        void flushSave();
        return;
      }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  /* ------------------------- mutation handlers -------------------------- */

  const acceptFiles = useCallback(
    (files: File[]) => {
      if (!canEditLessons) return;
      const remaining = PHOTO_COLLAGE_MAX_ITEMS - items.length;
      if (remaining <= 0) return;
      const accepted: File[] = [];
      for (const f of files.slice(0, remaining)) {
        if (!f.type.startsWith('image/')) {
          notify.error(tToast('wrongContentTypeImage'));
          continue;
        }
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
      if (accepted.length === 0) return;
      const additions: EditorItem[] = accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        return {
          kind: 'new',
          id: _newId('new'),
          file,
          previewUrl,
          caption: '',
        };
      });
      const next = [...items, ...additions];
      setItems(next);
      scheduleSave({ items: next, title }, true);
    },
    [canEditLessons, items, notify, scheduleSave, tToast, title],
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!canEditLessons) return;
      const target = items.find((it) => it.id === id);
      if (!target) return;
      if (target.kind === 'new') {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      const next = items.filter((it) => it.id !== id);
      setItems(next);
      // Don't auto-save below the minimum — the server would reject.
      // Hold the state dirty until the user uploads a replacement,
      // then schedule the save then.
      if (next.length >= PHOTO_COLLAGE_MIN_ITEMS) {
        scheduleSave({ items: next, title }, true);
      } else {
        dirtyRef.current = true;
        pendingSaveRef.current = { items: next, title };
      }
    },
    [canEditLessons, items, scheduleSave, title],
  );

  const reorderItems = useCallback(
    (orderedIds: string[]) => {
      const byId = new Map(items.map((it) => [it.id, it]));
      const ordered = orderedIds
        .map((id) => byId.get(id))
        .filter((it): it is EditorItem => Boolean(it));
      setItems(ordered);
      scheduleSave({ items: ordered, title }, true);
    },
    [items, scheduleSave, title],
  );

  const updateCaption = useCallback(
    (id: string, caption: string) => {
      const next = items.map((it) =>
        it.id === id ? ({ ...it, caption } as EditorItem) : it,
      );
      setItems(next);
      scheduleSave({ items: next, title });
    },
    [items, scheduleSave, title],
  );

  const updateTitle = useCallback(
    (value: string) => {
      setTitle(value);
      scheduleSave({ items, title: value });
    },
    [items, scheduleSave],
  );

  /* ------------------------------- DnD ---------------------------------- */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: canEditLessons
        ? { distance: 6 }
        : { distance: 999_999 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((it) => it.id === active.id);
      const newIndex = items.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const moved = arrayMove(items, oldIndex, newIndex);
      reorderItems(moved.map((it) => it.id));
    },
    [items, reorderItems],
  );

  const itemIds = useMemo(() => items.map((it) => it.id), [items]);
  const canAddMore = items.length < PHOTO_COLLAGE_MAX_ITEMS;
  const isBusy = isPreparing || mutation.isPending;

  return (
    <div className="flex flex-col gap-3">
      <Input
        id={titleId}
        value={title}
        onChange={(e) => updateTitle(e.target.value)}
        placeholder={t('titlePlaceholder')}
        disabled={!canEditLessons || isBusy}
        title={!canEditLessons ? insufficientPermissionsTitle : undefined}
        className="max-w-md"
      />

      <DndContext
        id={`collage-${block.id}-dnd`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <CollageItemCard
                key={item.id}
                item={item}
                disabled={!canEditLessons || isBusy}
                disabledTitle={
                  !canEditLessons ? insufficientPermissionsTitle : undefined
                }
                onRemove={() => removeItem(item.id)}
                onCaptionChange={(caption) => updateCaption(item.id, caption)}
                dragLabel={t('dragItem')}
                removeLabel={t('removeItem')}
                captionPlaceholder={t('captionPlaceholder')}
              />
            ))}
            {canAddMore ? (
              <li>
                <UploadTile
                  disabled={!canEditLessons || isBusy}
                  disabledTitle={
                    !canEditLessons ? insufficientPermissionsTitle : undefined
                  }
                  onFiles={acceptFiles}
                  promptBold={t('uploadPromptBold')}
                  promptRest={t('uploadPromptRest')}
                  hint={t('uploadHint', { maxMb: COLLAGE_ITEM_MAX_MB })}
                />
              </li>
            ) : null}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex h-5 items-center justify-end gap-1.5 text-xs text-muted-foreground">
        {isBusy ? (
          <>
            <Loader2Icon className="size-3 animate-spin" />
            <span>{t('saving')}</span>
          </>
        ) : !canAddMore ? (
          <span>{t('maxReached', { max: PHOTO_COLLAGE_MAX_ITEMS })}</span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Item card                                                                  */
/* -------------------------------------------------------------------------- */

type CollageItemCardProps = {
  item: EditorItem;
  disabled: boolean;
  disabledTitle?: string;
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
  dragLabel: string;
  removeLabel: string;
  captionPlaceholder: string;
};

function CollageItemCard({
  item,
  disabled,
  disabledTitle,
  onRemove,
  onCaptionChange,
  dragLabel,
  removeLabel,
  captionPlaceholder,
}: CollageItemCardProps) {
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

  const src = item.kind === 'new' ? item.previewUrl : item.apiFile.url;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/collage-item flex flex-col gap-2 rounded-xl border border-border bg-card p-2',
        isDragging && 'opacity-90 shadow-lg',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.caption || ''}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <button
          type="button"
          {...attributes}
          {...(disabled ? {} : listeners)}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          aria-label={dragLabel}
          className={cn(
            'absolute left-2 top-2 flex size-7 touch-none items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/collage-item:opacity-100',
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
          title={disabled ? disabledTitle : undefined}
          aria-label={removeLabel}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/collage-item:opacity-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-background/85 disabled:hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <Input
        value={item.caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        maxLength={PHOTO_COLLAGE_CAPTION_MAX_LEN}
        placeholder={captionPlaceholder}
        disabled={disabled}
      />
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload tile                                                                */
/* -------------------------------------------------------------------------- */

type UploadTileProps = {
  disabled: boolean;
  disabledTitle?: string;
  onFiles: (files: File[]) => void;
  promptBold: string;
  promptRest: string;
  hint: string;
};

function UploadTile({
  disabled,
  disabledTitle,
  onFiles,
  promptBold,
  promptRest,
  hint,
}: UploadTileProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const pickFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFiles],
  );

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

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      onClick={openPicker}
      onKeyDown={onKeyDown}
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

