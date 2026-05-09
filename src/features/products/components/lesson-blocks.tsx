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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVerticalIcon,
  PlayIcon,
  PlusIcon,
  SigmaIcon,
  Trash2Icon,
  TypeIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { InlineLatexEditor } from '@/shared/ui/inline-latex-editor';
import { InlineRichEditor } from '@/shared/ui/inline-rich-editor';

import type { LessonBlock } from '../model/draft';

export type CreatableBlockType = 'html' | 'katex';

export type LessonBlocksProps = {
  blocks: LessonBlock[];
  onUpdateHtml: (blockId: string, html: string) => void;
  onUpdateKatex: (blockId: string, source: string) => void;
  onAddBlock: (type: CreatableBlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  /** When false, all block-level mutations (add/edit/delete/reorder) are disabled. */
  canEditLessons?: boolean;
  /** Tooltip text shown on disabled controls when gated by permission. */
  insufficientPermissionsTitle?: string;
};

const HTML_DEBOUNCE_MS = 600;
const KATEX_DEBOUNCE_MS = 600;

export function LessonBlocks({
  blocks,
  onUpdateHtml,
  onUpdateKatex,
  onAddBlock,
  onRemoveBlock,
  onReorder,
  canEditLessons = true,
  insufficientPermissionsTitle,
}: LessonBlocksProps) {
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
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(blocks, oldIndex, newIndex);
      onReorder(next.map((b) => b.id));
    },
    [blocks, onReorder],
  );

  const itemIds = blocks.map((b) => b.id);

  return (
    <div className="group/lesson flex flex-col">
      <DndContext
        id="lesson-blocks-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col">
            {blocks.map((block, idx) => (
              <SortableBlock
                key={block.id}
                block={block}
                isFirst={idx === 0}
                onUpdateHtml={(html) => onUpdateHtml(block.id, html)}
                onUpdateKatex={(source) => onUpdateKatex(block.id, source)}
                onRemove={() => onRemoveBlock(block.id)}
                canEditLessons={canEditLessons}
                insufficientPermissionsTitle={insufficientPermissionsTitle}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <AddBlockMenu
        onSelect={onAddBlock}
        hasBlocks={blocks.length > 0}
        disabled={!canEditLessons}
        disabledTitle={insufficientPermissionsTitle}
      />
    </div>
  );
}

type SortableBlockProps = {
  block: LessonBlock;
  isFirst: boolean;
  onUpdateHtml: (html: string) => void;
  onUpdateKatex: (source: string) => void;
  onRemove: () => void;
  canEditLessons: boolean;
  insufficientPermissionsTitle?: string;
};

function SortableBlock({
  block,
  isFirst,
  onUpdateHtml,
  onUpdateKatex,
  onRemove,
  canEditLessons,
  insufficientPermissionsTitle,
}: SortableBlockProps) {
  const t = useTranslations('teach-products.editor');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: !canEditLessons });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/block relative',
        !isFirst && 'mt-6',
        isDragging && 'opacity-80',
      )}
    >
      {!isFirst ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-3 h-px bg-border/50 opacity-0 transition-opacity duration-200 group-hover/lesson:opacity-100 group-focus-within/lesson:opacity-100"
        />
      ) : null}

      <button
        type="button"
        {...attributes}
        {...(canEditLessons ? listeners : {})}
        disabled={!canEditLessons}
        title={!canEditLessons ? insufficientPermissionsTitle : undefined}
        aria-label={t('block.drag')}
        className={cn(
          'absolute -left-7 top-1 hidden size-6 touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex',
          canEditLessons
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-not-allowed opacity-40',
          'opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100',
          isDragging && 'cursor-grabbing opacity-100',
        )}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canEditLessons}
        title={!canEditLessons ? insufficientPermissionsTitle : undefined}
        aria-label={t('block.delete')}
        className="absolute -right-7 top-1 hidden size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/block:opacity-100 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground lg:inline-flex"
      >
        <Trash2Icon className="size-3.5" />
      </button>

      {block.type === 'html' ? (
        <DebouncedHtmlEditor
          blockId={block.id}
          value={block.html}
          onChange={onUpdateHtml}
          placeholder={t('contentEditor.placeholder')}
          emptyText={t('contentEditor.empty')}
        />
      ) : block.type === 'katex' ? (
        <DebouncedKatexEditor
          blockId={block.id}
          value={block.source}
          onChange={onUpdateKatex}
          emptyText={t('formula.empty')}
        />
      ) : (
        <RutubeBlockView
          embedUrl={block.embedUrl}
          title={block.title}
        />
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Debounced editors                                                          */
/* -------------------------------------------------------------------------- */

type DebouncedEditorProps = {
  blockId: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Wrap inline editors in a debounce so high-frequency keystrokes don't flood
 * the API. We send the latest value at most every `HTML_DEBOUNCE_MS` ms; on
 * unmount or when the block id changes we flush pending writes.
 */
function DebouncedHtmlEditor({
  blockId,
  value,
  onChange,
  placeholder,
  emptyText,
}: DebouncedEditorProps & { placeholder: string; emptyText: string }) {
  const flush = useDebouncedFlush(blockId, value, onChange, HTML_DEBOUNCE_MS);
  return (
    <InlineRichEditor
      key={blockId}
      value={value}
      onChange={flush}
      placeholder={placeholder}
      emptyText={emptyText}
    />
  );
}

function DebouncedKatexEditor({
  blockId,
  value,
  onChange,
  emptyText,
}: DebouncedEditorProps & { emptyText: string }) {
  const flush = useDebouncedFlush(blockId, value, onChange, KATEX_DEBOUNCE_MS);
  return (
    <InlineLatexEditor
      key={blockId}
      value={value}
      onChange={flush}
      emptyText={emptyText}
    />
  );
}

function useDebouncedFlush(
  blockId: string,
  serverValue: string,
  onChange: (value: string) => void,
  delayMs: number,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const serverValueRef = useRef(serverValue);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    serverValueRef.current = serverValue;
  }, [serverValue]);

  // Flush pending writes whenever the active block changes (or on unmount):
  // a debounced edit on the previous block must reach the server before the
  // editor is reused for another id.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value !== null && value !== serverValueRef.current) {
        onChangeRef.current(value);
      }
    };
  }, [blockId]);

  return useCallback(
    (next: string) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const value = pendingRef.current;
        pendingRef.current = null;
        if (value !== null) onChangeRef.current(value);
      }, delayMs);
    },
    [delayMs],
  );
}

/* -------------------------------------------------------------------------- */
/* Rutube block — read-only display (no editor UI yet)                        */
/* -------------------------------------------------------------------------- */

function RutubeBlockView({
  embedUrl,
  title,
}: {
  embedUrl: string;
  title: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title ?? 'Rutube'}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {title ? (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-foreground">
          <PlayIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add-block menu                                                             */
/* -------------------------------------------------------------------------- */

type AddBlockMenuProps = {
  onSelect: (type: CreatableBlockType) => void;
  hasBlocks: boolean;
  disabled?: boolean;
  disabledTitle?: string;
};

function AddBlockMenu({
  onSelect,
  hasBlocks,
  disabled,
  disabledTitle,
}: AddBlockMenuProps) {
  const t = useTranslations('teach-products.editor');
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        hasBlocks ? 'mt-8' : 'mt-2',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              title={disabled ? disabledTitle : undefined}
              className="relative gap-1.5 bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted"
            />
          }
        >
          <PlusIcon /> {t('actions.addBlock')}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          sideOffset={8}
          className="w-[320px] p-1.5"
        >
          <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('block.menuLabel')}
          </p>
          <BlockTypeMenuItem
            icon={<TypeIcon />}
            label={t('block.types.html')}
            description={t('block.types.htmlDescription')}
            onSelect={() => onSelect('html')}
          />
          <BlockTypeMenuItem
            icon={<SigmaIcon />}
            label={t('block.types.katex')}
            description={t('block.types.katexDescription')}
            onSelect={() => onSelect('katex')}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type BlockTypeMenuItemProps = {
  icon: ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
};

function BlockTypeMenuItem({
  icon,
  label,
  description,
  onSelect,
}: BlockTypeMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="group/item flex cursor-pointer items-start gap-3 rounded-md p-2"
    >
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10 transition-colors group-focus/item:bg-foreground/10 group-focus/item:text-foreground"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className="truncate text-sm font-medium leading-tight text-foreground">
          {label}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </DropdownMenuItem>
  );
}
