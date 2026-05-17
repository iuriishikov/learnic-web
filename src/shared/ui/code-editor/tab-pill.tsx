'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XIcon } from 'lucide-react';
import { type CSSProperties, useCallback, useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { TAB_LABEL_MAX_LEN } from './constants';

type TabPillProps = {
  dndId: string;
  label: string;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommit: (label: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
  removeAriaLabel: string;
  renameAriaLabel: string;
  reorderAriaLabel: string;
};

export function TabPill({
  dndId,
  label,
  isActive,
  isEditing,
  onSelect,
  onStartRename,
  onCommit,
  onCancel,
  onRemove,
  removeAriaLabel,
  renameAriaLabel,
  reorderAriaLabel,
}: TabPillProps) {
  // The whole pill is the drag handle (Chrome-tabs style). Activation
  // distance on the parent's PointerSensor (6px) lets onClick on the
  // inner button still fire — only a real drag gesture starts a sort.
  // Drag is suppressed while renaming so the input gets normal focus.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId, disabled: isEditing });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      // The pill is a flex container; drag affordances live on the
      // outer wrapper so listeners cover label + close button alike.
      // `cursor-grab` switches to `grabbing` mid-drag; on focus we
      // signal that keyboard reorder is available via `aria-roledescription`.
      aria-roledescription={reorderAriaLabel}
      className={cn(
        'group/tab inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
        isEditing
          ? 'cursor-text'
          : 'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'opacity-80 shadow-md ring-1 ring-brand/40',
      )}
    >
      {isEditing ? (
        <RenameTabInput
          initialValue={label}
          onCommit={onCommit}
          onCancel={onCancel}
          ariaLabel={renameAriaLabel}
        />
      ) : (
        <button
          type="button"
          onClick={isActive ? onStartRename : onSelect}
          onDoubleClick={onStartRename}
          title={isActive ? renameAriaLabel : label}
          className="cursor-[inherit] font-mono"
        >
          {label || '—'}
        </button>
      )}

      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            // Stop the click from bubbling to the pill's drag-aware
            // listeners — without this, dnd-kit can interpret a quick
            // mousedown-on-X as the start of a sort.
            e.stopPropagation();
            onRemove();
          }}
          // Stop pointer events too: the PointerSensor listens on
          // pointerdown, which fires before click — we don't want it
          // to engage when the user is clearly aiming at the X.
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={removeAriaLabel}
          title={removeAriaLabel}
          className={cn(
            'inline-flex size-4 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100',
            'hover:bg-destructive/10 hover:text-destructive',
            isActive && 'opacity-60',
          )}
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

type RenameTabInputProps = {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  ariaLabel: string;
};

/**
 * Isolated rename input — mounted only while a tab is being renamed,
 * so seeding state from the current label happens via `useState`'s
 * lazy initializer rather than an effect that watches props.
 */
function RenameTabInput({
  initialValue,
  onCommit,
  onCancel,
  ariaLabel,
}: RenameTabInputProps) {
  const [draft, setDraft] = useState(initialValue);

  // Auto-focus on mount. Pure side-effect (touches the DOM, no React
  // state), so the lint rule against setState-in-effect doesn't apply.
  const onMountRef = useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    requestAnimationFrame(() => {
      node.focus();
      node.select();
    });
  }, []);

  return (
    <input
      ref={onMountRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value.slice(0, TAB_LABEL_MAX_LEN))}
      onBlur={() => onCommit(draft.trim() || initialValue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(draft.trim() || initialValue);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      maxLength={TAB_LABEL_MAX_LEN}
      aria-label={ariaLabel}
      className="h-5 w-24 rounded bg-transparent px-1 font-mono text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}
