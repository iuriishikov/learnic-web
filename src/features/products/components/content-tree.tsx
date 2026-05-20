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
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export type ContentTreeLesson = {
  id: string;
  title: string;
};

export type ContentTreeModule = {
  id: string;
  title: string;
  lessons: ContentTreeLesson[];
};

export type ContentTreeProps = {
  modules: ContentTreeModule[];
  selectedLessonId?: string | null;
  onSelectLesson?: (moduleId: string, lessonId: string) => void;
  onAddModule: () => void;
  onRenameModule: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onReorderModules: (orderedIds: string[]) => void;
  onAddLesson: (moduleId: string) => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (moduleId: string, orderedIds: string[]) => void;
  onMoveLesson?: (lessonId: string, targetModuleId: string) => void;
  /** Lesson id whose row should mount in inline-rename mode (e.g. just-created). */
  pendingRenameId?: string | null;
  /** Fired when an externally-requested rename has been resolved (commit / cancel). */
  onPendingRenameResolved?: () => void;
  /** When false, all module-level mutations (add/rename/delete/reorder) are disabled. */
  canEditModules?: boolean;
  /** When false, all lesson-level mutations (add/rename/delete/reorder/move) are disabled. */
  canEditLessons?: boolean;
  /** Tooltip text shown on disabled controls when gated by permission. */
  insufficientPermissionsTitle?: string;
  className?: string;
};

const MODULE_PREFIX = 'module:';
const LESSON_PREFIX = 'lesson:';

/**
 * Modular content tree: a sortable list of modules, each with a sortable list
 * of lessons. All mutations go through the per-action callbacks supplied by
 * the parent — the tree itself owns no business state.
 */
export function ContentTree({
  modules,
  selectedLessonId,
  onSelectLesson,
  onAddModule,
  onRenameModule,
  onDeleteModule,
  onReorderModules,
  onAddLesson,
  onRenameLesson,
  onDeleteLesson,
  onReorderLessons,
  onMoveLesson,
  pendingRenameId,
  onPendingRenameResolved,
  canEditModules = true,
  canEditLessons = true,
  insufficientPermissionsTitle,
  className,
}: ContentTreeProps) {
  const t = useTranslations('teach-products.editor.tree');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(modules.map((m) => [m.id, true])),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSeenPending, setLastSeenPending] = useState<string | null>(null);

  // Mirror the parent's "rename this freshly created entity" prop into local
  // editing state. We use the "store previous prop" pattern instead of an
  // effect so a render with a new pendingRenameId enters edit mode in the
  // same render — no flicker, no extra paint.
  const normalizedPending = pendingRenameId ?? null;
  if (normalizedPending !== lastSeenPending) {
    setLastSeenPending(normalizedPending);
    if (normalizedPending) setEditingId(normalizedPending);
  }

  const resolveRename = useCallback(() => {
    setEditingId(null);
    onPendingRenameResolved?.();
  }, [onPendingRenameResolved]);

  const dndDisabled = !canEditModules && !canEditLessons;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: dndDisabled
        ? { distance: 999_999 }
        : { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const moduleIds = modules.map((m) => `${MODULE_PREFIX}${m.id}`);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (
        activeId.startsWith(MODULE_PREFIX) &&
        overId.startsWith(MODULE_PREFIX)
      ) {
        const oldIndex = modules.findIndex(
          (m) => `${MODULE_PREFIX}${m.id}` === activeId,
        );
        const newIndex = modules.findIndex(
          (m) => `${MODULE_PREFIX}${m.id}` === overId,
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(modules, oldIndex, newIndex);
        onReorderModules(next.map((m) => m.id));
        return;
      }

      if (
        activeId.startsWith(LESSON_PREFIX) &&
        overId.startsWith(LESSON_PREFIX)
      ) {
        const findParent = (lessonKey: string) =>
          modules.find((m) =>
            m.lessons.some((l) => `${LESSON_PREFIX}${l.id}` === lessonKey),
          );
        const fromModule = findParent(activeId);
        const toModule = findParent(overId);
        if (!fromModule || !toModule) return;

        if (fromModule.id !== toModule.id) {
          // Cross-module move — append to target module then reorder by hand.
          if (!onMoveLesson) return;
          const lessonId = activeId.slice(LESSON_PREFIX.length);
          onMoveLesson(lessonId, toModule.id);
          return;
        }

        const oldIndex = fromModule.lessons.findIndex(
          (l) => `${LESSON_PREFIX}${l.id}` === activeId,
        );
        const newIndex = fromModule.lessons.findIndex(
          (l) => `${LESSON_PREFIX}${l.id}` === overId,
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(fromModule.lessons, oldIndex, newIndex);
        onReorderLessons(
          fromModule.id,
          next.map((l) => l.id),
        );
      }
    },
    [modules, onReorderModules, onReorderLessons, onMoveLesson],
  );

  const handleAddModule = () => {
    onAddModule();
  };

  const toggleExpanded = (moduleId: string) =>
    setExpanded((prev) => ({ ...prev, [moduleId]: !(prev[moduleId] ?? true) }));

  return (
    <div className={cn('flex flex-col', className)}>
      <DndContext
        id="content-tree-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={moduleIds}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-0.5">
            {modules.map((module) => (
              <SortableModule
                key={module.id}
                module={module}
                expanded={expanded[module.id] ?? true}
                editing={editingId === module.id}
                editingLessonId={editingId}
                selectedLessonId={selectedLessonId ?? null}
                onToggle={() => toggleExpanded(module.id)}
                onStartRename={() => setEditingId(module.id)}
                onCommitRename={(title) => {
                  onRenameModule(module.id, title);
                  resolveRename();
                }}
                onCancelRename={resolveRename}
                onDelete={() => onDeleteModule(module.id)}
                onAddLesson={() => {
                  setExpanded((prev) => ({ ...prev, [module.id]: true }));
                  onAddLesson(module.id);
                }}
                onLessonSelect={(lessonId) =>
                  onSelectLesson?.(module.id, lessonId)
                }
                onLessonStartRename={(lessonId) => setEditingId(lessonId)}
                onLessonCommitRename={(lessonId, title) => {
                  onRenameLesson(lessonId, title);
                  resolveRename();
                }}
                onLessonCancelRename={resolveRename}
                onLessonDelete={(lessonId) => onDeleteLesson(lessonId)}
                canEditModules={canEditModules}
                canEditLessons={canEditLessons}
                insufficientPermissionsTitle={insufficientPermissionsTitle}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAddModule}
        disabled={!canEditModules}
        title={!canEditModules ? insufficientPermissionsTitle : undefined}
        className="mt-1.5 h-8 w-full justify-start gap-1.5 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <PlusIcon className="size-3.5" /> {t('addModule')}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Module row                                                                 */
/* -------------------------------------------------------------------------- */

type SortableModuleProps = {
  module: ContentTreeModule;
  expanded: boolean;
  editing: boolean;
  editingLessonId: string | null;
  selectedLessonId: string | null;
  onToggle: () => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onLessonSelect: (lessonId: string) => void;
  onLessonStartRename: (lessonId: string) => void;
  onLessonCommitRename: (lessonId: string, title: string) => void;
  onLessonCancelRename: () => void;
  onLessonDelete: (lessonId: string) => void;
  canEditModules: boolean;
  canEditLessons: boolean;
  insufficientPermissionsTitle?: string;
};

function SortableModule({
  module,
  expanded,
  editing,
  editingLessonId,
  selectedLessonId,
  onToggle,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  onAddLesson,
  onLessonSelect,
  onLessonStartRename,
  onLessonCommitRename,
  onLessonCancelRename,
  onLessonDelete,
  canEditModules,
  canEditLessons,
  insufficientPermissionsTitle,
}: SortableModuleProps) {
  const t = useTranslations('teach-products.editor.tree');
  const reduceMotion = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${MODULE_PREFIX}${module.id}`,
    disabled: !canEditModules,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
  const lessonIds = module.lessons.map((l) => `${LESSON_PREFIX}${l.id}`);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md',
        isDragging && 'opacity-70 shadow-md ring-1 ring-brand/40',
      )}
    >
      <Row
        leading={
          <DragHandle
            attributes={attributes}
            listeners={listeners}
            ariaLabel={t('reorderModule')}
            disabled={!canEditModules}
            disabledTitle={insufficientPermissionsTitle}
          />
        }
        chevron={
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? t('collapse') : t('expand')}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRightIcon
              className={cn(
                'size-3.5 transition-transform duration-150',
                expanded && 'rotate-90',
              )}
            />
          </button>
        }
        icon={<FolderIcon className="size-3.5 text-muted-foreground" />}
        title={module.title}
        editing={editing}
        canStartRename={canEditModules}
        onStartRename={onStartRename}
        onCommitRename={onCommitRename}
        onCancelRename={onCancelRename}
        actions={
          <RowMenu
            renameLabel={t('renameModule')}
            deleteLabel={t('deleteModule')}
            menuLabel={t('moduleActions')}
            onRename={onStartRename}
            onDelete={onDelete}
            canRename={canEditModules}
            canDelete={canEditModules}
            extraItems={
              <DropdownMenuItem
                onClick={onAddLesson}
                disabled={!canEditLessons}
              >
                <PlusIcon /> {t('addLesson')}
              </DropdownMenuItem>
            }
          />
        }
        navCursorKey={`module.${module.id}.nav`}
        editCursorKey={`module.${module.id}.title`}
        emphasized
      />

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="lessons"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }
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
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, overflow: 'hidden' }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            <SortableContext
              items={lessonIds}
              strategy={verticalListSortingStrategy}
            >
              <ul className="ml-3 flex flex-col gap-0.5 border-l border-border/70 pl-1.5 pt-0.5">
                {module.lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    selected={selectedLessonId === lesson.id}
                    editing={editingLessonId === lesson.id}
                    onSelect={() => onLessonSelect(lesson.id)}
                    onStartRename={() => onLessonStartRename(lesson.id)}
                    onCommitRename={(title) =>
                      onLessonCommitRename(lesson.id, title)
                    }
                    onCancelRename={onLessonCancelRename}
                    onDelete={() => onLessonDelete(lesson.id)}
                    canEditLessons={canEditLessons}
                    insufficientPermissionsTitle={insufficientPermissionsTitle}
                  />
                ))}
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onAddLesson}
                    disabled={!canEditLessons}
                    title={
                      !canEditLessons ? insufficientPermissionsTitle : undefined
                    }
                    className="h-7 w-full justify-start gap-1.5 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <PlusIcon className="size-3" /> {t('addLesson')}
                  </Button>
                </li>
              </ul>
            </SortableContext>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Lesson row                                                                 */
/* -------------------------------------------------------------------------- */

type SortableLessonProps = {
  lesson: ContentTreeLesson;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
  canEditLessons: boolean;
  insufficientPermissionsTitle?: string;
};

function SortableLesson({
  lesson,
  selected,
  editing,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  canEditLessons,
  insufficientPermissionsTitle,
}: SortableLessonProps) {
  const t = useTranslations('teach-products.editor.tree');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${LESSON_PREFIX}${lesson.id}`,
    disabled: !canEditLessons,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md',
        isDragging && 'opacity-70 shadow-md ring-1 ring-brand/40',
      )}
    >
      <Row
        leading={
          <DragHandle
            attributes={attributes}
            listeners={listeners}
            ariaLabel={t('reorderLesson')}
            disabled={!canEditLessons}
            disabledTitle={insufficientPermissionsTitle}
          />
        }
        icon={<FileTextIcon className="size-3.5 text-muted-foreground" />}
        title={lesson.title}
        editing={editing}
        selected={selected}
        canStartRename={canEditLessons}
        onActivate={onSelect}
        onStartRename={onStartRename}
        onCommitRename={onCommitRename}
        onCancelRename={onCancelRename}
        actions={
          <RowMenu
            renameLabel={t('renameLesson')}
            deleteLabel={t('deleteLesson')}
            menuLabel={t('lessonActions')}
            onRename={onStartRename}
            onDelete={onDelete}
            canRename={canEditLessons}
            canDelete={canEditLessons}
          />
        }
        navCursorKey={`lesson.${lesson.id}.nav`}
        editCursorKey={`lesson.${lesson.id}.title`}
      />
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable row + drag handle + inline rename                                 */
/* -------------------------------------------------------------------------- */

type RowProps = {
  leading: React.ReactNode;
  chevron?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  selected?: boolean;
  emphasized?: boolean;
  /** When false, double-click to inline-rename is disabled. */
  canStartRename?: boolean;
  onActivate?: () => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  actions: React.ReactNode;
  /** Stable key for the activation button (sent on focus as "viewing"). */
  navCursorKey?: string;
  /** Stable key for the inline-rename input (sent on focus as "editing"). */
  editCursorKey?: string;
};

function Row({
  leading,
  chevron,
  icon,
  title,
  editing,
  selected,
  emphasized,
  canStartRename = true,
  onActivate,
  onStartRename,
  onCommitRename,
  onCancelRename,
  actions,
  navCursorKey,
  editCursorKey,
}: RowProps) {
  return (
    <div
      className={cn(
        'group/row relative flex items-center gap-1 rounded-md pl-0.5 pr-1 transition-colors',
        selected
          ? 'bg-brand/10 text-brand'
          : 'hover:bg-muted/60',
        emphasized && 'font-medium',
      )}
    >
      {leading}
      {chevron}
      <span className="flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {editing ? (
        <RowRename
          initial={title}
          onCommit={onCommitRename}
          onCancel={onCancelRename}
          cursorTargetKey={editCursorKey}
        />
      ) : (
        <button
          type="button"
          onClick={onActivate}
          onDoubleClick={canStartRename ? onStartRename : undefined}
          data-cursor-target={navCursorKey}
          data-cursor-action={navCursorKey ? 'viewing' : undefined}
          className={cn(
            'flex-1 truncate px-1 py-1 text-left text-sm',
            !onActivate && 'cursor-default',
          )}
        >
          {title}
        </button>
      )}
      <span className="opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100">
        {actions}
      </span>
    </div>
  );
}

function RowRename({
  initial,
  onCommit,
  onCancel,
  cursorTargetKey,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  cursorTargetKey?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const trimmed = draft.trim();
      if (trimmed) onCommit(trimmed);
      else onCancel();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== initial) onCommit(trimmed);
        else onCancel();
      }}
      onKeyDown={onKeyDown}
      data-cursor-target={cursorTargetKey}
      className="h-7 min-w-0 flex-1 rounded border border-ring bg-background px-1.5 text-sm text-foreground outline-none ring-2 ring-ring/30"
    />
  );
}

function DragHandle({
  attributes,
  listeners,
  ariaLabel,
  disabled,
  disabledTitle,
}: {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  ariaLabel: string;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      {...attributes}
      {...(disabled ? {} : listeners)}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-grab hover:text-muted-foreground active:cursor-grabbing',
        'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
      )}
    >
      <GripVerticalIcon className="size-3" />
    </button>
  );
}

function RowMenu({
  renameLabel,
  deleteLabel,
  menuLabel,
  onRename,
  onDelete,
  canRename = true,
  canDelete = true,
  extraItems,
}: {
  renameLabel: string;
  deleteLabel: string;
  menuLabel: string;
  onRename: () => void;
  onDelete: () => void;
  canRename?: boolean;
  canDelete?: boolean;
  extraItems?: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={menuLabel}
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          />
        }
      >
        <MoreVerticalIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={onRename}
          disabled={!canRename}
        >
          <PencilIcon /> {renameLabel}
        </DropdownMenuItem>
        {extraItems}
        <DropdownMenuItem
          variant="destructive"
          onClick={onDelete}
          disabled={!canDelete}
        >
          <Trash2Icon /> {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
