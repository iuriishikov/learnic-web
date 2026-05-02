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
  useId,
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

export type LessonNode = {
  id: string;
  title: string;
  /** Rich-text body for the lesson, persisted as HTML. */
  contentHtml?: string;
  /** Optional LaTeX formula for the lesson. */
  formula?: string;
};
export type ModuleNode = { id: string; title: string; lessons: LessonNode[] };

type ContentTreeProps = {
  modules: ModuleNode[];
  onChange: (modules: ModuleNode[]) => void;
  selectedLessonId?: string | null;
  onSelectLesson?: (moduleId: string, lessonId: string) => void;
  className?: string;
};

const MODULE_PREFIX = 'module:';
const LESSON_PREFIX = 'lesson:';

function uid(prefix: string, seed: string): string {
  return `${seed}-${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Modular content tree: a sortable list of modules, each with a sortable list
 * of lessons. Mock-only — drag-drop, add, delete and inline rename mutate the
 * `modules` array in place via `onChange`. No persistence yet.
 *
 * Drag scope is intentionally limited to "modules among modules" and "lessons
 * within their parent module" — cross-module lesson moves can come later.
 */
export function ContentTree({
  modules,
  onChange,
  selectedLessonId,
  onSelectLesson,
  className,
}: ContentTreeProps) {
  const t = useTranslations('teach-products.editor.tree');
  const seed = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(modules.map((m) => [m.id, true])),
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
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
        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(arrayMove(modules, oldIndex, newIndex));
        }
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
        if (!fromModule || !toModule || fromModule.id !== toModule.id) return;
        const oldIndex = fromModule.lessons.findIndex(
          (l) => `${LESSON_PREFIX}${l.id}` === activeId,
        );
        const newIndex = fromModule.lessons.findIndex(
          (l) => `${LESSON_PREFIX}${l.id}` === overId,
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(
            modules.map((m) =>
              m.id === fromModule.id
                ? { ...m, lessons: arrayMove(m.lessons, oldIndex, newIndex) }
                : m,
            ),
          );
        }
      }
    },
    [modules, onChange],
  );

  const addModule = () => {
    const id = uid('mod', seed);
    onChange([...modules, { id, title: t('newModule'), lessons: [] }]);
    setExpanded((prev) => ({ ...prev, [id]: true }));
    setEditingId(id);
  };

  const addLesson = (moduleId: string) => {
    const id = uid('les', seed);
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, { id, title: t('newLesson') }] }
          : m,
      ),
    );
    setExpanded((prev) => ({ ...prev, [moduleId]: true }));
    setEditingId(id);
  };

  const deleteModule = (moduleId: string) => {
    onChange(modules.filter((m) => m.id !== moduleId));
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m,
      ),
    );
  };

  const renameModule = (moduleId: string, title: string) => {
    onChange(modules.map((m) => (m.id === moduleId ? { ...m, title } : m)));
  };

  const renameLesson = (moduleId: string, lessonId: string, title: string) => {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, title } : l,
              ),
            }
          : m,
      ),
    );
  };

  const toggleExpanded = (moduleId: string) =>
    setExpanded((prev) => ({ ...prev, [moduleId]: !(prev[moduleId] ?? true) }));

  return (
    <div className={cn('flex flex-col', className)}>
      <DndContext
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
                  renameModule(module.id, title);
                  setEditingId(null);
                }}
                onCancelRename={() => setEditingId(null)}
                onDelete={() => deleteModule(module.id)}
                onAddLesson={() => addLesson(module.id)}
                onLessonSelect={(lessonId) =>
                  onSelectLesson?.(module.id, lessonId)
                }
                onLessonStartRename={(lessonId) => setEditingId(lessonId)}
                onLessonCommitRename={(lessonId, title) => {
                  renameLesson(module.id, lessonId, title);
                  setEditingId(null);
                }}
                onLessonCancelRename={() => setEditingId(null)}
                onLessonDelete={(lessonId) => deleteLesson(module.id, lessonId)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addModule}
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
  module: ModuleNode;
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
  } = useSortable({ id: `${MODULE_PREFIX}${module.id}` });
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
            extraItems={
              <DropdownMenuItem onClick={onAddLesson}>
                <PlusIcon /> {t('addLesson')}
              </DropdownMenuItem>
            }
          />
        }
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
                  />
                ))}
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onAddLesson}
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
  lesson: LessonNode;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
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
}: SortableLessonProps) {
  const t = useTranslations('teach-products.editor.tree');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${LESSON_PREFIX}${lesson.id}` });
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
          />
        }
        icon={<FileTextIcon className="size-3.5 text-muted-foreground" />}
        title={lesson.title}
        editing={editing}
        selected={selected}
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
          />
        }
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
  onActivate?: () => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  actions: React.ReactNode;
};

function Row({
  leading,
  chevron,
  icon,
  title,
  editing,
  selected,
  emphasized,
  onActivate,
  onStartRename,
  onCommitRename,
  onCancelRename,
  actions,
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
        />
      ) : (
        <button
          type="button"
          onClick={onActivate}
          onDoubleClick={onStartRename}
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
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
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
      className="h-7 flex-1 rounded border border-ring bg-background px-1.5 text-sm text-foreground outline-none ring-2 ring-ring/30"
    />
  );
}

function DragHandle({
  attributes,
  listeners,
  ariaLabel,
}: {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...attributes}
      {...listeners}
      className={cn(
        'flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/50 transition-colors',
        'hover:text-muted-foreground active:cursor-grabbing',
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
  extraItems,
}: {
  renameLabel: string;
  deleteLabel: string;
  menuLabel: string;
  onRename: () => void;
  onDelete: () => void;
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
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onRename}>
          <PencilIcon /> {renameLabel}
        </DropdownMenuItem>
        {extraItems}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2Icon /> {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
