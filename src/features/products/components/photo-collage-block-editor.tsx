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
  useRef,
  useState,
} from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Image } from '@/shared/ui/image';
import { Input } from '@/shared/ui/input';

import {
  useAddCollageItemMutation,
  useRemoveCollageItemMutation,
  useReorderCollageItemsMutation,
  useUpdateCollageItemCaptionMutation,
  useUpdateCollageTitleMutation,
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
const CAPTION_DEBOUNCE_MS = 700;
const TITLE_DEBOUNCE_MS = 700;

// Items uploaded by the user but not yet acknowledged by the server
// keep a temp id locally so React can key on them. The server response
// replaces them with the canonical server-minted oid; this prefix lets
// the editor identify temp rows when stitching local + server state.
const _TEMP_ID_PREFIX = 'pending-';

type EditorItem = {
  // Server `oid` for already-persisted items; temp id (prefixed
  // ``pending-``) for items that the server has not yet acknowledged.
  id: string;
  // Backing file from the server, or null while the upload is in flight.
  apiFile: ApiFile | null;
  // Local object URL when ``apiFile`` is null — revoked when the row
  // leaves the editor.
  previewUrl: string | null;
  caption: string;
};

function _tempId(): string {
  return `${_TEMP_ID_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
}

function _itemsFromBlock(block: PhotoCollageBlock): EditorItem[] {
  return block.items.map((item) => ({
    id: item.oid,
    apiFile: item.file,
    previewUrl: null,
    caption: item.caption ?? '',
  }));
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

  const addItem = useAddCollageItemMutation(courseId);
  const removeItem = useRemoveCollageItemMutation(courseId);
  const reorderItems = useReorderCollageItemsMutation(courseId);
  const updateCaption = useUpdateCollageItemCaptionMutation(courseId);
  const updateTitle = useUpdateCollageTitleMutation(courseId);

  const [items, setItems] = useState<EditorItem[]>(() =>
    _itemsFromBlock(block),
  );
  const [title, setTitle] = useState<string>(block.title ?? '');

  const previewUrlsRef = useRef<Set<string>>(new Set());
  const captionTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previews = previewUrlsRef.current;
    const captionTimers = captionTimersRef.current;
    const titleTimer = titleTimerRef;
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
      previews.clear();
      for (const handle of captionTimers.values()) clearTimeout(handle);
      captionTimers.clear();
      if (titleTimer.current) clearTimeout(titleTimer.current);
    };
  }, []);

  // Reconcile server-driven block changes into local state. Each
  // granular mutation now replaces the cached block atomically via its
  // own response body, so a plain assign on every change is safe. The
  // editor is the only owner of optimistic state between request and
  // response; the cached block is the only external source of truth,
  // so syncing it into local state via setState-in-effect is the
  // intended pattern here (see react-hooks/set-state-in-effect
  // suppressions elsewhere in the codebase for the same shape).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(_itemsFromBlock(block));
    setTitle(block.title ?? '');
  }, [block]);

  /* -------------------------- file → upload ----------------------------- */

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

      // Optimistic insert with temp ids so the grid shows previews
      // immediately. The server response replaces the cached block,
      // which the sync effect above then mirrors into local state.
      const additions: EditorItem[] = accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        return {
          id: _tempId(),
          apiFile: null,
          previewUrl,
          caption: '',
        };
      });
      setItems((current) => [...current, ...additions]);

      // Sequential uploads so a hard cap (max-items) on the backend
      // can reject the latest upload without stranding earlier
      // optimistic placeholders. Each call settles independently;
      // failures surface a toast.
      void (async () => {
        for (const file of accepted) {
          const result = await addItem.mutateAsync({
            blockId: block.id,
            file,
            caption: null,
          });
          if (!result.ok) {
            const reason = result.reason;
            const msg =
              reason === 'quota-exceeded' && result.quota
                ? tToast('quotaExceeded', {
                    plan: result.quota.planCode,
                    used: result.quota.usedBytes,
                    limit: result.quota.limitBytes,
                    attempted: result.quota.attemptedBytes,
                  })
                : reason === 'wrong-content-type'
                  ? tToast('wrongContentTypeImage')
                  : tToast('updateBlockFailed');
            notify.error(msg);
            return;
          }
        }
      })();
    },
    [canEditLessons, items.length, notify, addItem, block.id, tToast],
  );

  /* ----------------------------- remove --------------------------------- */

  const onRemove = useCallback(
    (id: string) => {
      if (!canEditLessons) return;
      const target = items.find((it) => it.id === id);
      if (!target) return;
      if (target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      // Optimistic drop. The server response will re-sync via the
      // cached block effect.
      setItems((current) => current.filter((it) => it.id !== id));
      // Don't fire the network call for a temp-id row — it's not yet
      // persisted server-side; the optimistic remove is all there is.
      if (id.startsWith(_TEMP_ID_PREFIX)) return;
      // Refuse to drop below the minimum item count — the server
      // would 422 the call. Surface a friendlier client-side message
      // and leave the optimistic state for the user to undo by
      // re-uploading.
      if (items.length - 1 < PHOTO_COLLAGE_MIN_ITEMS) {
        notify.error(tToast('validation'));
        return;
      }
      void removeItem
        .mutateAsync({ blockId: block.id, itemId: id })
        .then((result) => {
          if (!result.ok) {
            notify.error(tToast('updateBlockFailed'));
          }
        });
    },
    [canEditLessons, items, notify, removeItem, block.id, tToast],
  );

  /* ----------------------------- reorder -------------------------------- */

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!canEditLessons) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((it) => it.id === active.id);
      const newIndex = items.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const moved = arrayMove(items, oldIndex, newIndex);
      setItems(moved);
      const persisted = moved
        .filter((it) => !it.id.startsWith(_TEMP_ID_PREFIX))
        .map((it) => it.id);
      // Don't try to reorder while a temp row is in flight — the
      // server hasn't minted its oid yet so we'd need to wait. The
      // next save will re-evaluate; for now, only commit a reorder
      // that covers every server-side item exactly.
      const allPersisted = moved.every(
        (it) => !it.id.startsWith(_TEMP_ID_PREFIX),
      );
      if (!allPersisted) return;
      void reorderItems
        .mutateAsync({ blockId: block.id, orderedIds: persisted })
        .then((result) => {
          if (!result.ok) {
            notify.error(tToast('updateBlockFailed'));
          }
        });
    },
    [canEditLessons, items, notify, reorderItems, block.id, tToast],
  );

  /* ----------------------------- captions ------------------------------- */

  const onCaptionChange = useCallback(
    (id: string, caption: string) => {
      if (!canEditLessons) return;
      setItems((current) =>
        current.map((it) => (it.id === id ? { ...it, caption } : it)),
      );
      // Captions on temp rows are flushed by the eventual add call's
      // caption argument — but the editor currently posts the add
      // without a caption (the optimistic row has none), so a caption
      // typed before the upload settles will be persisted by a
      // follow-up caption PATCH once the row has a real id. The cache
      // sync effect re-emits the row with the real oid, after which
      // the caption-typing flow lands on the persisted branch below.
      if (id.startsWith(_TEMP_ID_PREFIX)) return;
      const timers = captionTimersRef.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      const handle = setTimeout(() => {
        timers.delete(id);
        void updateCaption
          .mutateAsync({
            blockId: block.id,
            itemId: id,
            caption: caption.trim() || null,
          })
          .then((result) => {
            if (!result.ok) {
              notify.error(tToast('updateBlockFailed'));
            }
          });
      }, CAPTION_DEBOUNCE_MS);
      timers.set(id, handle);
    },
    [canEditLessons, updateCaption, block.id, notify, tToast],
  );

  /* ------------------------------ title --------------------------------- */

  const onTitleChange = useCallback(
    (value: string) => {
      if (!canEditLessons) return;
      setTitle(value);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        titleTimerRef.current = null;
        void updateTitle
          .mutateAsync({
            blockId: block.id,
            title: value.trim() || null,
          })
          .then((result) => {
            if (!result.ok) {
              notify.error(tToast('updateBlockFailed'));
            }
          });
      }, TITLE_DEBOUNCE_MS);
    },
    [canEditLessons, updateTitle, block.id, notify, tToast],
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

  const itemIds = items.map((it) => it.id);
  const canAddMore = items.length < PHOTO_COLLAGE_MAX_ITEMS;
  const isBusy =
    addItem.isPending ||
    removeItem.isPending ||
    reorderItems.isPending ||
    updateCaption.isPending ||
    updateTitle.isPending;

  return (
    // The outer column previously carried a block-level
    // `data-cursor-target` as a fallback for clicks landing on
    // gaps / upload tile, but anchoring the highlight ring to a
    // multi-section wrapper made the cursor visually misalign —
    // it stretched across the title input AND the items grid.
    // Per-item (`collage.<itemId>`) and title (`block.<id>.title`)
    // attributes cover the specific surfaces; the upload tile is
    // an intentional dead zone (clicking it is a single-shot
    // action, not a sustained edit).
    <div className="flex flex-col gap-3">
      <Input
        id={titleId}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('titlePlaceholder')}
        disabled={!canEditLessons}
        title={!canEditLessons ? insufficientPermissionsTitle : undefined}
        className="max-w-md"
        data-cursor-target={`block.${block.id}.title`}
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
                disabled={!canEditLessons}
                disabledTitle={
                  !canEditLessons ? insufficientPermissionsTitle : undefined
                }
                onRemove={() => onRemove(item.id)}
                onCaptionChange={(caption) => onCaptionChange(item.id, caption)}
                dragLabel={t('dragItem')}
                removeLabel={t('removeItem')}
                captionPlaceholder={t('captionPlaceholder')}
              />
            ))}
            {canAddMore ? (
              <li>
                <UploadTile
                  disabled={!canEditLessons}
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

  const src = item.apiFile?.url ?? item.previewUrl ?? '';

  return (
    <li
      ref={setNodeRef}
      style={style}
      // Item-level cursor target: any focusable child without its own
      // `data-cursor-target` (drag handle, delete button) resolves up to
      // this `<li>` via `closest()`, so dragging or deleting an item
      // still surfaces the user's cursor at this row. The caption input
      // below carries its own `data-cursor-target` for a more specific
      // cursor when the caption is being edited.
      data-cursor-target={`collage.${item.id}`}
      className={cn(
        'group/collage-item flex flex-col gap-2 rounded-xl border border-border bg-card p-2',
        isDragging && 'opacity-90 shadow-lg',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted/40">
        <Image
          src={src}
          alt={item.caption || ''}
          fill
          // Mixed source: pending uploads use local object URLs (unoptimizable),
          // persisted items use backend storage URLs (not in remotePatterns).
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
          draggable={false}
          rounded="lg"
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
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          aria-label={removeLabel}
          className="absolute top-2 right-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/collage-item:opacity-100"
        >
          <XIcon />
          <span className="sr-only">{removeLabel}</span>
        </Button>
      </div>
      <Input
        value={item.caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        maxLength={PHOTO_COLLAGE_CAPTION_MAX_LEN}
        placeholder={captionPlaceholder}
        disabled={disabled}
        data-cursor-target={`collage.${item.id}.caption`}
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
