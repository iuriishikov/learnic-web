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
import { GripVerticalIcon, Trash2Icon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

export type EditorBlockDndProps = {
  /** Stable `DndContext` id — keeps SSR/CSR aria ids in sync. */
  id: string;
  /** Sortable ids in render order — one per `EditorBlockShell` row inside. */
  itemIds: string[];
  /** Receives the full id list in its new order after a successful drop. */
  onReorder: (orderedIds: string[]) => void;
  /** When false, dragging is disabled (pair with the rows' `canEdit`). */
  canEdit?: boolean;
  /** Observe drag activity, e.g. to pause hover micro-interactions mid-drag. */
  onDraggingChange?: (active: boolean) => void;
  children: ReactNode;
  className?: string;
};

/**
 * The outer drag-to-reorder shell for an `EditorBlockList`: sensors,
 * `DndContext`, vertical `SortableContext`, and the array-move bookkeeping.
 * Hands the reordered id array to `onReorder` and deliberately owns no entity
 * state — optimistic updates, persistence, and rollback stay with the caller.
 */
export function EditorBlockDnd({
  id,
  itemIds,
  onReorder,
  canEdit = true,
  onDraggingChange,
  children,
  className,
}: EditorBlockDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // An unreachable activation distance keeps pointer-drag inert while
      // editing is not allowed, without remounting the sensor stack.
      activationConstraint: canEdit ? { distance: 6 } : { distance: 999_999 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    onDraggingChange?.(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(itemIds, oldIndex, newIndex));
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={
        onDraggingChange ? () => onDraggingChange(true) : undefined
      }
      onDragCancel={
        onDraggingChange ? () => onDraggingChange(false) : undefined
      }
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <EditorBlockList className={className}>{children}</EditorBlockList>
      </SortableContext>
    </DndContext>
  );
}

export type EditorBlockListProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Container for a vertical stack of `EditorBlockShell` rows. It owns the
 * `group/blocklist` scope that the faint inter-block dividers reveal on hover —
 * so moving the pointer anywhere over the list lights up every block boundary.
 *
 * The caller still owns `DndContext` + `SortableContext` (sensors, the reorder
 * handler, the item ids); this is purely the list element the rows live in.
 */
export function EditorBlockList({ children, className }: EditorBlockListProps) {
  return (
    <ul className={cn('group/blocklist flex flex-col', className)}>
      {children}
    </ul>
  );
}

export type EditorBlockShellProps = {
  /** Sortable id — must match the id registered in the parent `SortableContext`. */
  id: string;
  /** First row skips the top divider and the top margin. */
  isFirst: boolean;
  /** Invoked when the floating delete control is activated. */
  onRemove: () => void;
  /** When false, drag + delete are disabled and the row is inert to dragging. */
  canEdit?: boolean;
  /** Tooltip shown on the disabled controls while `canEdit` is false. */
  disabledTitle?: string;
  /** Accessible label for the drag handle — already localized by the caller. */
  dragLabel: string;
  /** Accessible label for the delete control — already localized by the caller. */
  deleteLabel: string;
  /** The block body: the actual editor / preview for this block type. */
  children: ReactNode;
  className?: string;
};

/**
 * Shared chrome for an editable, drag-to-reorder content block — the bare row
 * used by both the note-lesson editor and the admin blog editor.
 *
 * There is intentionally no card border, no background, and no type-label
 * header: the block body itself is the block. The drag handle (left) and the
 * delete control (right) float just outside the content column and only appear
 * on hover / focus, on `lg` and up. A faint divider sits above every non-first
 * row and reveals when the surrounding `EditorBlockList` is hovered.
 */
export function EditorBlockShell({
  id,
  isFirst,
  onRemove,
  canEdit = true,
  disabledTitle,
  dragLabel,
  deleteLabel,
  children,
  className,
}: EditorBlockShellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canEdit });

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
        className,
      )}
    >
      {!isFirst ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-3 h-px bg-border/50 opacity-0 transition-opacity duration-200 group-hover/blocklist:opacity-100 group-focus-within/blocklist:opacity-100"
        />
      ) : null}

      <button
        type="button"
        {...attributes}
        {...(canEdit ? listeners : {})}
        disabled={!canEdit}
        title={!canEdit ? disabledTitle : undefined}
        aria-label={dragLabel}
        className={cn(
          'absolute -left-7 top-1 hidden size-6 touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex',
          canEdit
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
        disabled={!canEdit}
        title={!canEdit ? disabledTitle : undefined}
        aria-label={deleteLabel}
        className="absolute -right-7 top-1 hidden size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/block:opacity-100 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground lg:inline-flex"
      >
        <Trash2Icon className="size-3.5" />
      </button>

      {children}
    </li>
  );
}
