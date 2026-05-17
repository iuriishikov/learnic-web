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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { PlusIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { cn } from '@/shared/lib/utils';

import { TabPill } from './tab-pill';
import type { EditorTab } from './types';

type TabsStripProps = {
  tabs: EditorTab[];
  activeIndex: number;
  editingLabelIndex: number | null;
  onSelect: (index: number) => void;
  onStartRename: (index: number) => void;
  onCommitRename: (index: number, label: string) => void;
  onCancelRename: () => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  canAdd: boolean;
  onAdd: () => void;
  addAriaLabel: string;
  removeAriaLabel: string;
  renameAriaLabel: string;
  reorderAriaLabel: string;
};

export function TabsStrip({
  tabs,
  activeIndex,
  editingLabelIndex,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRemove,
  onReorder,
  canAdd,
  onAdd,
  addAriaLabel,
  removeAriaLabel,
  renameAriaLabel,
  reorderAriaLabel,
}: TabsStripProps) {
  const showTabs = tabs.length > 1;

  // dnd-kit only kicks in for multi-tab — single-tab blocks have nothing
  // to reorder, and unique non-empty labels (used as item IDs below) are
  // a multi-tab invariant anyway.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 6px activation distance lets onClick on the pill button still
      // fire normally; only an actual drag gesture flips into reorder.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tabIds = useMemo(() => tabs.map((tab) => tab.label), [tabs]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tabs.findIndex((t) => t.label === active.id);
      const newIndex = tabs.findIndex((t) => t.label === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onReorder(oldIndex, newIndex);
    },
    [tabs, onReorder],
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {showTabs ? (
        <DndContext
          id="code-tabs-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabIds}
            strategy={horizontalListSortingStrategy}
          >
            <ul className="flex min-w-0 flex-wrap items-center gap-1">
              {tabs.map((tab, index) => (
                <li key={tab.label} className="flex items-center">
                  <TabPill
                    dndId={tab.label}
                    label={tab.label}
                    isActive={index === activeIndex}
                    isEditing={index === editingLabelIndex}
                    onSelect={() => onSelect(index)}
                    onStartRename={() => onStartRename(index)}
                    onCommit={(value) => onCommitRename(index, value)}
                    onCancel={onCancelRename}
                    onRemove={() => onRemove(index)}
                    removeAriaLabel={removeAriaLabel}
                    renameAriaLabel={renameAriaLabel}
                    reorderAriaLabel={reorderAriaLabel}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addAriaLabel}
          title={addAriaLabel}
          className={cn(
            'inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-dashed border-border px-2 text-[12px] font-medium text-muted-foreground transition-colors',
            'hover:border-brand/60 hover:bg-brand/5 hover:text-brand',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <PlusIcon className="size-3.5" />
          {showTabs ? null : (
            <span className="text-[11px] uppercase tracking-wider">
              {addAriaLabel}
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}
