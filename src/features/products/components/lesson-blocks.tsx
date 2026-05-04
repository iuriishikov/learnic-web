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
  useId,
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

import type { LessonBlock, LessonBlockType } from './content-tree';

type LessonBlocksProps = {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
};

export function LessonBlocks({ blocks, onChange }: LessonBlocksProps) {
  const idSeed = useId();
  const counterRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const newBlockId = useCallback(() => {
    counterRef.current += 1;
    return `${idSeed}-${counterRef.current}`;
  }, [idSeed]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onChange(arrayMove(blocks, oldIndex, newIndex));
    },
    [blocks, onChange],
  );

  const onUpdate = useCallback(
    (id: string, content: string) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
    },
    [blocks, onChange],
  );

  const onRemove = useCallback(
    (id: string) => {
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange],
  );

  const onAdd = useCallback(
    (type: LessonBlockType) => {
      onChange([...blocks, { id: newBlockId(), type, content: '' }]);
    },
    [blocks, newBlockId, onChange],
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
                onUpdate={(content) => onUpdate(block.id, content)}
                onRemove={() => onRemove(block.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <AddBlockMenu onSelect={onAdd} hasBlocks={blocks.length > 0} />
    </div>
  );
}

type SortableBlockProps = {
  block: LessonBlock;
  isFirst: boolean;
  onUpdate: (content: string) => void;
  onRemove: () => void;
};

function SortableBlock({
  block,
  isFirst,
  onUpdate,
  onRemove,
}: SortableBlockProps) {
  const t = useTranslations('teach-products.editor');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

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
        {...listeners}
        aria-label={t('block.drag')}
        className={cn(
          'absolute -left-7 top-1 hidden size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex',
          'opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100',
          isDragging && 'cursor-grabbing opacity-100',
        )}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={t('block.delete')}
        className="absolute -right-7 top-1 hidden size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/block:opacity-100 lg:inline-flex"
      >
        <Trash2Icon className="size-3.5" />
      </button>

      {block.type === 'html' ? (
        <InlineRichEditor
          value={block.content}
          onChange={onUpdate}
          placeholder={t('contentEditor.placeholder')}
          emptyText={t('contentEditor.empty')}
        />
      ) : (
        <InlineLatexEditor
          value={block.content}
          onChange={onUpdate}
          emptyText={t('formula.empty')}
        />
      )}
    </li>
  );
}

type AddBlockMenuProps = {
  onSelect: (type: LessonBlockType) => void;
  hasBlocks: boolean;
};

function AddBlockMenu({ onSelect, hasBlocks }: AddBlockMenuProps) {
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
              className="relative gap-1.5 bg-background"
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
