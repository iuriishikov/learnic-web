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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVerticalIcon,
  HelpCircleIcon,
  PlusIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type ChangeEvent as ReactChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { Skeleton } from '@/shared/ui/skeleton';
import { DescriptionTextarea } from '@/shared/ui/textarea-extended';

import type { ProductQA } from '../api/qa';
import {
  useAddQAMutation,
  useChangeQAAnswerMutation,
  useChangeQAQuestionMutation,
  useDeleteQAMutation,
  useProductQA,
  useReorderQAMutation,
} from '../api/use-product-qa';
import { useProductPermissions } from '../api/use-product-permissions';
import { EditorSection } from './editor-row';

const QUESTION_DEBOUNCE_MS = 500;
const ANSWER_DEBOUNCE_MS = 600;
const QUESTION_MAX = 500;
const ANSWER_MAX = 5000;

type ProductQASectionProps = {
  productId: string;
};

export function ProductQASection({ productId }: ProductQASectionProps) {
  const t = useTranslations('teach-products.editor.qa');
  const tEditor = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();

  const query = useProductQA(productId);
  const addQA = useAddQAMutation(productId);
  const changeQuestion = useChangeQAQuestionMutation(productId);
  const changeAnswer = useChangeQAAnswerMutation(productId);
  const deleteQA = useDeleteQAMutation(productId);
  const reorderQA = useReorderQAMutation(productId);
  const perms = useProductPermissions(productId);
  const canEditQA = perms.canEditQA;
  const insufficientTitle = tEditor('insufficientPermissions');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: canEditQA
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
      const entries = query.data ?? [];
      const fromIdx = entries.findIndex((e) => e.id === active.id);
      const toIdx = entries.findIndex((e) => e.id === over.id);
      if (fromIdx < 0 || toIdx < 0) return;
      reorderQA.mutate({
        qaId: String(active.id),
        position: toIdx,
      });
    },
    [query.data, reorderQA],
  );

  const handleAdd = useCallback(() => {
    addQA.mutate({
      question: t('placeholders.questionDefault'),
      answer: t('placeholders.answerDefault'),
    });
  }, [addQA, t]);

  const sectionActions =
    !query.isPending && !query.isError && query.data.length > 0 ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={addQA.isPending || !canEditQA}
        title={!canEditQA ? insufficientTitle : undefined}
        className="gap-1.5"
      >
        <PlusIcon className="size-4" /> {t('add')}
      </Button>
    ) : null;

  return (
    <motion.div
      key="qa-section"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      <EditorSection
        title={t('title')}
        description={t('description')}
        actions={sectionActions}
      >
        <div className="py-6" aria-label={query.isPending ? t('loading') : undefined}>
          {query.isPending ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : query.isError ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 rounded-xl bg-muted/40 px-4 py-4"
            >
              <p className="text-sm font-medium text-foreground">
                {t('error.title')}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('error.description')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                className="mt-1 gap-1.5"
              >
                <RotateCwIcon
                  className={cn('size-3', query.isFetching && 'animate-spin')}
                />
                {t('error.retry')}
              </Button>
            </div>
          ) : query.data.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl bg-muted/40 px-5 py-6">
              <div className="flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
                <HelpCircleIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('empty.title')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t('empty.description')}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={addQA.isPending || !canEditQA}
                title={!canEditQA ? insufficientTitle : undefined}
                className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <PlusIcon className="size-4" /> {t('add')}
              </Button>
            </div>
          ) : (
            <DndContext
              id="qa-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={query.data.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-3">
                  {query.data.map((entry) => (
                    <SortableQARow
                      key={entry.id}
                      entry={entry}
                      onChangeQuestion={(value) =>
                        changeQuestion.mutate({ qaId: entry.id, value })
                      }
                      onChangeAnswer={(value) =>
                        changeAnswer.mutate({ qaId: entry.id, value })
                      }
                      onDelete={() => deleteQA.mutate({ qaId: entry.id })}
                      canEditQA={canEditQA}
                      insufficientPermissionsTitle={insufficientTitle}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </EditorSection>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sortable row                                                               */
/* -------------------------------------------------------------------------- */

type SortableQARowProps = {
  entry: ProductQA;
  onChangeQuestion: (value: string) => void;
  onChangeAnswer: (value: string) => void;
  onDelete: () => void;
  canEditQA: boolean;
  insufficientPermissionsTitle?: string;
};

function SortableQARow({
  entry,
  onChangeQuestion,
  onChangeAnswer,
  onDelete,
  canEditQA,
  insufficientPermissionsTitle,
}: SortableQARowProps) {
  const t = useTranslations('teach-products.editor.qa');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: !canEditQA });

  // Use only dnd-kit's transform/transition for positioning. Wrapping the row
  // in `motion.li` with `layout` causes Framer Motion to animate the same
  // layout shifts that dnd-kit is already driving — they fight every frame
  // and the drag visibly stutters.
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const flushQuestion = useDebouncedCommit(
    entry.id,
    entry.question,
    onChangeQuestion,
    QUESTION_DEBOUNCE_MS,
  );
  const flushAnswer = useDebouncedCommit(
    entry.id,
    entry.answer,
    onChangeAnswer,
    ANSWER_DEBOUNCE_MS,
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/qa relative flex items-start gap-2 rounded-xl border border-border bg-background p-3 transition-shadow',
        isDragging && 'opacity-80 shadow-md ring-1 ring-brand/40',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...(canEditQA ? listeners : {})}
        disabled={!canEditQA}
        title={!canEditQA ? insufficientPermissionsTitle : undefined}
        aria-label={t('drag')}
        className={cn(
          'mt-1 flex size-7 shrink-0 touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          canEditQA
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-not-allowed opacity-40',
          isDragging && 'cursor-grabbing',
        )}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <QuestionField
          rowId={entry.id}
          initialValue={entry.question}
          onCommit={flushQuestion}
          placeholder={t('placeholders.question')}
          ariaLabel={t('aria.question')}
          requiredMessage={t('validation.questionRequired')}
          readOnly={!canEditQA}
          disabledTitle={insufficientPermissionsTitle}
        />
        <AnswerField
          rowId={entry.id}
          initialValue={entry.answer}
          onCommit={flushAnswer}
          placeholder={t('placeholders.answer')}
          ariaLabel={t('aria.answer')}
          requiredMessage={t('validation.answerRequired')}
          readOnly={!canEditQA}
          disabledTitle={insufficientPermissionsTitle}
        />
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={!canEditQA}
        title={!canEditQA ? insufficientPermissionsTitle : undefined}
        aria-label={t('delete')}
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/qa:opacity-100 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </li>
  );
}

/**
 * Controlled question field. The value is owned locally so Base UI's
 * FieldControl never sees `defaultValue` shift after mount (the warning we
 * were getting). Remounting on `rowId` change re-seeds from the server value
 * — that's the "temp id → real id swap" boundary.
 */
function QuestionField({
  rowId,
  initialValue,
  onCommit,
  placeholder,
  ariaLabel,
  requiredMessage,
  readOnly,
  disabledTitle,
}: {
  rowId: string;
  initialValue: string;
  onCommit: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  requiredMessage: string;
  readOnly?: boolean;
  disabledTitle?: string;
}) {
  const [draft, setDraft] = useState(initialValue);
  const isEmpty = draft.trim().length === 0;
  return (
    <div className="flex flex-col gap-1">
      <TextInput
        key={rowId}
        value={draft}
        maxLength={QUESTION_MAX}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-required="true"
        aria-invalid={isEmpty || undefined}
        disabled={readOnly}
        title={readOnly ? disabledTitle : undefined}
        onChange={(e: ReactChangeEvent<HTMLInputElement>) => {
          const next = e.target.value;
          setDraft(next);
          // The backend rejects empty question/answer with 422 — skip commit
          // entirely. The previous valid value stays on the server, the UI
          // shows the empty draft, and the inline error explains why.
          if (next.trim().length > 0) onCommit(next);
        }}
        onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-9 border-transparent bg-transparent px-2 text-base font-medium shadow-none focus-visible:bg-background focus-visible:border-ring md:text-base"
        data-cursor-target={`product.qa.${rowId}.question`}
      />
      {isEmpty ? (
        <p role="alert" className="px-2 text-xs text-destructive">
          {requiredMessage}
        </p>
      ) : null}
    </div>
  );
}

function AnswerField({
  rowId,
  initialValue,
  onCommit,
  placeholder,
  ariaLabel,
  requiredMessage,
  readOnly,
  disabledTitle,
}: {
  rowId: string;
  initialValue: string;
  onCommit: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  requiredMessage: string;
  readOnly?: boolean;
  disabledTitle?: string;
}) {
  const [draft, setDraft] = useState(initialValue);
  const isEmpty = draft.trim().length === 0;
  return (
    <div className="flex flex-col gap-1">
      <DescriptionTextarea
        key={rowId}
        value={draft}
        maxLength={ANSWER_MAX}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-required="true"
        aria-invalid={isEmpty || undefined}
        disabled={readOnly}
        title={readOnly ? disabledTitle : undefined}
        onChange={(e: ReactChangeEvent<HTMLTextAreaElement>) => {
          const next = e.target.value;
          setDraft(next);
          if (next.trim().length > 0) onCommit(next);
        }}
        className="min-h-[60px] border-transparent bg-transparent px-2 py-1.5 text-sm leading-relaxed shadow-none focus-visible:bg-background focus-visible:border-ring"
        data-cursor-target={`product.qa.${rowId}.answer`}
      />
      {isEmpty ? (
        <p role="alert" className="px-2 text-xs text-destructive">
          {requiredMessage}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Per-field debounce that flushes pending writes:
 *   - on unmount (don't lose typing on tab switch)
 *   - when the row id changes (component reused for a different entry)
 *   - when the server-side value changes (don't re-send the same string)
 */
function useDebouncedCommit(
  rowId: string,
  serverValue: string,
  commit: (value: string) => void,
  delayMs: number,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const commitRef = useRef(commit);
  const serverValueRef = useRef(serverValue);

  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  useEffect(() => {
    serverValueRef.current = serverValue;
  }, [serverValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value !== null && value !== serverValueRef.current) {
        commitRef.current(value);
      }
    };
  }, [rowId]);

  return useCallback(
    (next: string) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const value = pendingRef.current;
        pendingRef.current = null;
        if (value !== null && value !== serverValueRef.current) {
          commitRef.current(value);
        }
      }, delayMs);
    },
    [delayMs],
  );
}
