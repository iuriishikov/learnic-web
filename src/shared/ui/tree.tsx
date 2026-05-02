'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/utils';

export type TreeGroupNode = {
  id: string;
  type: 'group';
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: TreeNode[];
};

export type TreeItemNode = {
  id: string;
  type: 'item';
  label: string;
  icon?: ReactNode;
  meta?: ReactNode;
};

export type TreeNode = TreeGroupNode | TreeItemNode;

export type TreeReorderInfo = {
  parentId: string | null;
  itemId: string;
  fromIndex: number;
  toIndex: number;
};

type TreeProps = {
  data: TreeNode[];
  onReorder?: (info: TreeReorderInfo, nextSiblingIds: string[]) => void;
  onItemClick?: (id: string) => void;
  selectedId?: string | null;
  defaultOpenIds?: ReadonlyArray<string>;
  className?: string;
  ariaLabel?: string;
  reorderable?: boolean;
};

type TreeContextValue = {
  selectedId: string | null;
  onItemClick?: (id: string) => void;
  reorderable: boolean;
  activeDragId: UniqueIdentifier | null;
};

const TreeContext = createContext<TreeContextValue | null>(null);

function useTreeContext() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('Tree subcomponents must be used within <Tree />');
  return ctx;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.6 };

function flattenInitialOpenIds(
  nodes: TreeNode[],
  defaultOpenIds: ReadonlyArray<string> | undefined,
  acc: Set<string>,
): Set<string> {
  for (const node of nodes) {
    if (node.type === 'group') {
      const explicit = defaultOpenIds?.includes(node.id);
      if (explicit || node.defaultOpen) acc.add(node.id);
      flattenInitialOpenIds(node.children, defaultOpenIds, acc);
    }
  }
  return acc;
}

function findParentAndIndex(
  nodes: TreeNode[],
  itemId: string,
  parentId: string | null = null,
): { parent: TreeNode[] | null; parentId: string | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === itemId) {
      return { parent: nodes, parentId, index: i };
    }
    if (node.type === 'group') {
      const found = findParentAndIndex(node.children, itemId, node.id);
      if (found) return found;
    }
  }
  return null;
}

function findNodeById(nodes: TreeNode[], id: UniqueIdentifier | null): TreeNode | null {
  if (id == null) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.type === 'group') {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function Tree({
  data,
  onReorder,
  onItemClick,
  selectedId = null,
  defaultOpenIds,
  className,
  ariaLabel,
  reorderable = true,
}: TreeProps) {
  const t = useTranslations('tree');
  // Stable id keeps dnd-kit's internal aria-describedby identifiers aligned
  // between SSR and the client — without it React reports a hydration mismatch.
  const dndContextId = useId();
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Touch: long-press to drag so taps and scroll-gestures aren't hijacked.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id);
  }, []);

  const onDragCancel = useCallback(() => setActiveDragId(null), []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const from = findParentAndIndex(data, String(active.id));
      const to = findParentAndIndex(data, String(over.id));
      if (!from || !to) return;
      // Cross-parent moves are out of scope — items reorder within their
      // immediate parent only.
      if (from.parentId !== to.parentId) return;
      if (!from.parent) return;

      const reordered = arrayMove(from.parent, from.index, to.index);
      const nextSiblingIds = reordered.map((n) => n.id);

      onReorder?.(
        {
          parentId: from.parentId,
          itemId: String(active.id),
          fromIndex: from.index,
          toIndex: to.index,
        },
        nextSiblingIds,
      );
    },
    [data, onReorder],
  );

  const ctxValue = useMemo<TreeContextValue>(
    () => ({
      selectedId,
      onItemClick,
      reorderable,
      activeDragId,
    }),
    [selectedId, onItemClick, reorderable, activeDragId],
  );

  const dragOverlayNode = findNodeById(data, activeDragId);

  const tree = (
    <TreeContext.Provider value={ctxValue}>
      <div
        role="tree"
        aria-label={ariaLabel ?? t('label')}
        className={cn('w-full select-none text-sm', className)}
      >
        <TreeBranch nodes={data} depth={0} defaultOpenIds={defaultOpenIds} />
      </div>
    </TreeContext.Provider>
  );

  if (!reorderable) return tree;

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {tree}
      <DragOverlay>
        {dragOverlayNode ? (
          <div className="flex max-w-[280px] items-center gap-1.5 rounded-md bg-background px-2 py-1.5 text-sm shadow-lg ring-1 ring-border">
            <GripVerticalIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {dragOverlayNode.type === 'group' ? (
              <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : null}
            {dragOverlayNode.icon ? (
              <span className="shrink-0 text-muted-foreground">{dragOverlayNode.icon}</span>
            ) : null}
            <span
              className={cn(
                'truncate',
                dragOverlayNode.type === 'group'
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-foreground',
              )}
            >
              {dragOverlayNode.label}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type TreeBranchProps = {
  nodes: TreeNode[];
  depth: number;
  defaultOpenIds?: ReadonlyArray<string>;
};

function TreeBranch({ nodes, depth, defaultOpenIds }: TreeBranchProps) {
  const { reorderable } = useTreeContext();

  // Each branch is its own SortableContext — children reorder within their
  // immediate parent only.
  const ids = nodes.map((n) => n.id);

  const branchContent = (
    <ul role="group" className="flex flex-col">
      {nodes.map((node) => (
        <li key={node.id} role="none" className="list-none">
          {node.type === 'group' ? (
            <TreeGroup node={node} depth={depth} defaultOpenIds={defaultOpenIds} />
          ) : (
            <TreeItem node={node} depth={depth} />
          )}
        </li>
      ))}
    </ul>
  );

  if (!reorderable) return branchContent;

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {branchContent}
    </SortableContext>
  );
}

type TreeGroupProps = {
  node: TreeGroupNode;
  depth: number;
  defaultOpenIds?: ReadonlyArray<string>;
};

function TreeGroup({ node, depth, defaultOpenIds }: TreeGroupProps) {
  const t = useTranslations('tree');
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const initiallyOpen = useMemo(
    () => flattenInitialOpenIds([node], defaultOpenIds, new Set()).has(node.id),
    [node, defaultOpenIds],
  );
  const [open, setOpen] = useState(initiallyOpen);

  const { reorderable, activeDragId } = useTreeContext();
  const sortable = useSortable({ id: node.id, disabled: !reorderable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const onToggle = useCallback(() => setOpen((v) => !v), []);

  const style = reorderable
    ? { transform: CSS.Translate.toString(transform), transition }
    : undefined;

  const placeholderMode = isDragging || activeDragId === node.id;
  // Collapse children visually while the group is being dragged so the
  // surrounding rows don't shift twice.
  const showChildren = open && !placeholderMode;

  return (
    <div
      ref={reorderable ? setNodeRef : undefined}
      style={style}
      role="treeitem"
      aria-expanded={open}
      aria-selected={false}
      aria-label={node.label}
      className={cn(placeholderMode && 'opacity-40')}
    >
      <TreeRow
        depth={depth}
        onActivate={onToggle}
        ariaControls={panelId}
        leading={
          <motion.span
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
            className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <ChevronRightIcon className="size-3.5" />
          </motion.span>
        }
        icon={node.icon}
        label={node.label}
        bold
        ariaLabel={
          open ? t('collapse', { name: node.label }) : t('expand', { name: node.label })
        }
        dragHandleProps={
          reorderable
            ? {
                ...attributes,
                ...listeners,
                'aria-label': t('drag', { name: node.label }),
              }
            : undefined
        }
      />
      <AnimatePresence initial={false}>
        {showChildren ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, overflow: 'hidden' }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    height: 'auto',
                    transitionEnd: { overflow: 'visible' },
                  }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, overflow: 'hidden' }
            }
            transition={reduceMotion ? { duration: 0 } : { ...SPRING, mass: 0.7 }}
          >
            <TreeBranch
              nodes={node.children}
              depth={depth + 1}
              defaultOpenIds={defaultOpenIds}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type TreeItemProps = {
  node: TreeItemNode;
  depth: number;
};

function TreeItem({ node, depth }: TreeItemProps) {
  const t = useTranslations('tree');
  const { selectedId, onItemClick, reorderable, activeDragId } = useTreeContext();
  const selected = selectedId === node.id;

  const sortable = useSortable({ id: node.id, disabled: !reorderable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const style = reorderable
    ? { transform: CSS.Translate.toString(transform), transition }
    : undefined;

  const placeholderMode = isDragging || activeDragId === node.id;

  return (
    <div
      ref={reorderable ? setNodeRef : undefined}
      style={style}
      role="treeitem"
      aria-selected={selected}
      className={cn(placeholderMode && 'opacity-40')}
    >
      <TreeRow
        depth={depth}
        onActivate={() => onItemClick?.(node.id)}
        selected={selected}
        icon={node.icon}
        label={node.label}
        meta={node.meta}
        dragHandleProps={
          reorderable
            ? {
                ...attributes,
                ...listeners,
                'aria-label': t('drag', { name: node.label }),
              }
            : undefined
        }
      />
    </div>
  );
}

type TreeRowProps = {
  depth: number;
  onActivate: () => void;
  ariaControls?: string;
  ariaLabel?: string;
  leading?: ReactNode;
  icon?: ReactNode;
  label: string;
  meta?: ReactNode;
  bold?: boolean;
  selected?: boolean;
  dragHandleProps?: Record<string, unknown>;
};

function TreeRow({
  depth,
  onActivate,
  ariaControls,
  ariaLabel,
  leading,
  icon,
  label,
  meta,
  bold,
  selected,
  dragHandleProps,
}: TreeRowProps) {
  // 16px per level — matches the visual rhythm in the reference design.
  const indentPx = depth * 16;

  return (
    <div
      className={cn(
        'group/tree-row relative flex items-center gap-1 rounded-md py-1.5 pr-1.5 transition-colors',
        selected
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
      style={{ paddingLeft: `${4 + indentPx}px` }}
    >
      {dragHandleProps ? (
        <button
          type="button"
          {...dragHandleProps}
          className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/0 transition-[color,background-color] hover:bg-foreground/5 hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing group-hover/tree-row:text-muted-foreground/70 [@media(hover:none)]:text-muted-foreground/60"
        >
          <GripVerticalIcon className="size-3.5" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onActivate}
        aria-controls={ariaControls}
        aria-label={ariaLabel}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {leading}
        {icon ? (
          <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <span
          className={cn(
            'truncate',
            bold ? 'font-semibold text-foreground' : 'font-medium',
          )}
        >
          {label}
        </span>
      </button>
      {meta ? (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{meta}</span>
      ) : null}
    </div>
  );
}
