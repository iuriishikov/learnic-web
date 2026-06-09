'use client';

import {
  CheckCircle2Icon,
  CheckIcon,
  Loader2Icon,
  LockIcon,
  XCircleIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';

import { useCheckBlockAnswer, useRevealBlockAnswer } from '../api/use-answer-check';
import type {
  PublicMultiChoiceBlock,
  PublicSingleChoiceBlock,
  PublicTextInputBlock,
} from '../model/public-content';
import type { SavedBlockAnswer } from '../model/saved-answer';

/* -------------------------------------------------------------------------- */
/* Shared shell                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Bare wrapper for a learner answer block while reading a lesson. No card
 * chrome and no uppercase eyebrow title — inside the lesson column the
 * answer reads as a plain choice (options + actions), not a recessed task
 * panel. The interactive group inside carries its own `aria-label` so the
 * answer type stays announced to assistive tech without a visible heading.
 */
function LearnerBlock({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

/** Muted lock hint shown to guests in place of the check / reveal controls. */
function GuestLockedRow() {
  const t = useTranslations('product-reader');
  return (
    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <LockIcon className="size-3.5 shrink-0" />
      <span>{t('answers.guestLocked')}</span>
    </div>
  );
}

type Verdict = 'correct' | 'incorrect' | null;

/** Verdict implied by a saved answer (correct → green, otherwise red). */
function verdictFromSaved(saved: SavedBlockAnswer | null): Verdict {
  if (!saved) return null;
  return saved.isCorrect ? 'correct' : 'incorrect';
}

/**
 * Restore a learner block from its saved answer. Each block lazily seeds its
 * initial state from `savedAnswer` (so a server-seeded answer paints without a
 * flash); this hook additionally re-applies the saved answer if it arrives or
 * changes *after* mount — e.g. the saved-answers fetch resolving after the
 * content, or a release switch handing down a different saved set — but only
 * while the learner hasn't touched the block yet. Returns a `markTouched`
 * callback the block calls on the first interaction to stop further restores.
 */
function useSavedAnswerRestore(
  savedAnswer: SavedBlockAnswer | null,
  restore: (saved: SavedBlockAnswer) => void,
): () => void {
  const touchedRef = useRef(false);
  useEffect(() => {
    if (touchedRef.current || !savedAnswer) return;
    restore(savedAnswer);
  }, [savedAnswer, restore]);
  return useCallback(() => {
    touchedRef.current = true;
  }, []);
}

/** Inline verdict row shown after a successful check. */
function VerdictRow({ verdict }: { verdict: Exclude<Verdict, null> }) {
  const t = useTranslations('product-reader');
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'mt-3 flex items-center gap-1.5 text-sm font-medium',
        verdict === 'correct' ? 'text-brand' : 'text-destructive',
      )}
    >
      {verdict === 'correct' ? (
        <CheckCircle2Icon className="size-4 shrink-0" />
      ) : (
        <XCircleIcon className="size-4 shrink-0" />
      )}
      <span>{verdict === 'correct' ? t('answers.correct') : t('answers.incorrect')}</span>
    </motion.div>
  );
}

/** Persistent inline error Alert shown when check / reveal fails. */
function BlockErrorAlert({ title }: { title: string }) {
  const t = useTranslations('product-reader');
  return (
    <Alert variant="destructive" className="mt-3">
      <XCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{t('answers.errorDescription')}</AlertDescription>
    </Alert>
  );
}

/* -------------------------------------------------------------------------- */
/* Choice option (shared by single + multi)                                   */
/* -------------------------------------------------------------------------- */

type ChoiceOptionRowProps = {
  label: string;
  mode: 'radio' | 'checkbox';
  selected: boolean;
  /** Highlight as a revealed-correct option (ring + brand check). */
  revealedCorrect: boolean;
  disabled: boolean;
  /** Radio rows: the option id submitted through the parent `RadioGroup`. */
  value?: string;
  /** Checkbox rows: toggle the option in the parent's selection set. */
  onToggle?: () => void;
};

/**
 * One selectable option. Both modes wrap the real shadcn primitive in a
 * `<label>` — multi-choice rows the `Checkbox`, single-choice rows the
 * `RadioGroupItem` (the parent `RadioGroup` supplies roving focus, arrow-key
 * navigation and the radiogroup ARIA semantics). Both carry the same
 * recessed-surface chrome with a brand ring marking the learner's current
 * selection and the revealed-correct answer(s); the revealed state also
 * carries a visually-hidden text marker so it survives without sight.
 */
function ChoiceOptionRow({
  label,
  mode,
  selected,
  revealedCorrect,
  disabled,
  value,
  onToggle,
}: ChoiceOptionRowProps) {
  const t = useTranslations('product-reader');
  const surfaceClass = cn(
    'flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors',
    'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
    !disabled && 'cursor-pointer hover:border-brand/40 hover:bg-muted/40',
    selected && 'border-brand/60 bg-brand/[0.05]',
    revealedCorrect && 'border-brand bg-brand/[0.08] ring-1 ring-brand',
    disabled && 'cursor-not-allowed opacity-70',
  );

  const revealedMarker = revealedCorrect ? (
    <>
      <CheckIcon aria-hidden className="size-4 shrink-0 text-brand" />
      <span className="sr-only">{t('answers.revealedCorrectSr')}</span>
    </>
  ) : null;

  if (mode === 'checkbox') {
    return (
      <li>
        <label className={surfaceClass}>
          <Checkbox
            checked={selected}
            disabled={disabled}
            onCheckedChange={onToggle}
            className={cn(
              revealedCorrect && 'border-brand data-checked:border-brand data-checked:bg-brand',
            )}
          />
          <span className="min-w-0 flex-1">{label}</span>
          {revealedMarker}
        </label>
      </li>
    );
  }

  return (
    <label className={surfaceClass}>
      <RadioGroupItem
        // `value` is always provided for radio rows; the assert keeps the
        // checkbox branch from having to carry it.
        value={value as string}
        disabled={disabled}
        className={cn(
          'data-checked:border-brand data-checked:bg-brand',
          revealedCorrect && 'border-brand',
        )}
      />
      <span className="min-w-0 flex-1">{label}</span>
      {revealedMarker}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Single choice                                                              */
/* -------------------------------------------------------------------------- */

export type LearnerSingleChoiceBlockProps = {
  block: PublicSingleChoiceBlock;
  noteId: string;
  canAnswer: boolean;
  savedAnswer?: SavedBlockAnswer | null;
};

export function LearnerSingleChoiceBlock({
  block,
  noteId,
  canAnswer,
  savedAnswer = null,
}: LearnerSingleChoiceBlockProps) {
  const t = useTranslations('product-reader');
  const check = useCheckBlockAnswer(noteId);
  const reveal = useRevealBlockAnswer(noteId);

  const [selected, setSelected] = useState<string | null>(() =>
    savedAnswer?.submission.type === 'single_choice'
      ? savedAnswer.submission.optionId
      : null,
  );
  const [verdict, setVerdict] = useState<Verdict>(() =>
    verdictFromSaved(savedAnswer),
  );
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string> | null>(null);

  const restore = useCallback((saved: SavedBlockAnswer) => {
    if (saved.submission.type !== 'single_choice') return;
    setSelected(saved.submission.optionId);
    setVerdict(saved.isCorrect ? 'correct' : 'incorrect');
  }, []);
  const markTouched = useSavedAnswerRestore(savedAnswer, restore);

  // Changing the selection invalidates a stale verdict + mutation errors,
  // so the learner can retry from a clean state.
  const pick = (oid: string) => {
    markTouched();
    setSelected(oid);
    setVerdict(null);
    check.reset();
  };

  const runCheck = () => {
    if (!selected) return;
    check.mutate(
      { blockId: block.id, payload: { type: 'single_choice', optionId: selected } },
      { onSuccess: ({ isCorrect }) => setVerdict(isCorrect ? 'correct' : 'incorrect') },
    );
  };

  const runReveal = () => {
    reveal.mutate(
      { blockId: block.id },
      {
        onSuccess: (answer) => {
          if (answer.type === 'single_choice') {
            setRevealedIds(new Set([answer.optionId]));
          }
        },
      },
    );
  };

  return (
    <LearnerBlock>
      <RadioGroup
        aria-label={t('answers.singleTitle')}
        value={selected}
        onValueChange={(value) => pick(String(value))}
        disabled={!canAnswer}
        className="flex w-full flex-col gap-2"
      >
        {block.options.map((option) => (
          <ChoiceOptionRow
            key={option.oid}
            label={option.label}
            mode="radio"
            value={option.oid}
            selected={selected === option.oid}
            revealedCorrect={revealedIds?.has(option.oid) ?? false}
            disabled={!canAnswer}
          />
        ))}
      </RadioGroup>

      {canAnswer ? (
        <AnswerActions
          checkDisabled={!selected}
          isChecking={check.isPending}
          isRevealing={reveal.isPending}
          onCheck={runCheck}
          onReveal={runReveal}
        />
      ) : (
        <GuestLockedRow />
      )}

      {verdict ? <VerdictRow verdict={verdict} /> : null}
      {check.isError ? <BlockErrorAlert title={t('answers.checkErrorTitle')} /> : null}
      {reveal.isError ? <BlockErrorAlert title={t('answers.revealErrorTitle')} /> : null}
    </LearnerBlock>
  );
}

/* -------------------------------------------------------------------------- */
/* Multi choice                                                               */
/* -------------------------------------------------------------------------- */

export type LearnerMultiChoiceBlockProps = {
  block: PublicMultiChoiceBlock;
  noteId: string;
  canAnswer: boolean;
  savedAnswer?: SavedBlockAnswer | null;
};

export function LearnerMultiChoiceBlock({
  block,
  noteId,
  canAnswer,
  savedAnswer = null,
}: LearnerMultiChoiceBlockProps) {
  const t = useTranslations('product-reader');
  const check = useCheckBlockAnswer(noteId);
  const reveal = useRevealBlockAnswer(noteId);

  const [selected, setSelected] = useState<ReadonlySet<string>>(() =>
    savedAnswer?.submission.type === 'multi_choice'
      ? new Set(savedAnswer.submission.optionIds)
      : new Set(),
  );
  const [verdict, setVerdict] = useState<Verdict>(() =>
    verdictFromSaved(savedAnswer),
  );
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string> | null>(null);

  const restore = useCallback((saved: SavedBlockAnswer) => {
    if (saved.submission.type !== 'multi_choice') return;
    setSelected(new Set(saved.submission.optionIds));
    setVerdict(saved.isCorrect ? 'correct' : 'incorrect');
  }, []);
  const markTouched = useSavedAnswerRestore(savedAnswer, restore);

  const toggle = (oid: string) => {
    markTouched();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(oid)) next.delete(oid);
      else next.add(oid);
      return next;
    });
    setVerdict(null);
    check.reset();
  };

  const runCheck = () => {
    if (selected.size === 0) return;
    check.mutate(
      {
        blockId: block.id,
        payload: { type: 'multi_choice', optionIds: [...selected] },
      },
      { onSuccess: ({ isCorrect }) => setVerdict(isCorrect ? 'correct' : 'incorrect') },
    );
  };

  const runReveal = () => {
    reveal.mutate(
      { blockId: block.id },
      {
        onSuccess: (answer) => {
          if (answer.type === 'multi_choice') {
            setRevealedIds(new Set(answer.optionIds));
          }
        },
      },
    );
  };

  return (
    <LearnerBlock>
      <ul
        role="group"
        aria-label={t('answers.multiTitle')}
        className="flex flex-col gap-2"
      >
        {block.options.map((option) => (
          <ChoiceOptionRow
            key={option.oid}
            label={option.label}
            mode="checkbox"
            selected={selected.has(option.oid)}
            revealedCorrect={revealedIds?.has(option.oid) ?? false}
            disabled={!canAnswer}
            onToggle={() => toggle(option.oid)}
          />
        ))}
      </ul>

      {canAnswer ? (
        <AnswerActions
          checkDisabled={selected.size === 0}
          isChecking={check.isPending}
          isRevealing={reveal.isPending}
          onCheck={runCheck}
          onReveal={runReveal}
        />
      ) : (
        <GuestLockedRow />
      )}

      {verdict ? <VerdictRow verdict={verdict} /> : null}
      {check.isError ? <BlockErrorAlert title={t('answers.checkErrorTitle')} /> : null}
      {reveal.isError ? <BlockErrorAlert title={t('answers.revealErrorTitle')} /> : null}
    </LearnerBlock>
  );
}

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

export type LearnerTextInputBlockProps = {
  block: PublicTextInputBlock;
  noteId: string;
  canAnswer: boolean;
  savedAnswer?: SavedBlockAnswer | null;
};

export function LearnerTextInputBlock({
  block,
  noteId,
  canAnswer,
  savedAnswer = null,
}: LearnerTextInputBlockProps) {
  const t = useTranslations('product-reader');
  const check = useCheckBlockAnswer(noteId);
  const reveal = useRevealBlockAnswer(noteId);

  const [answer, setAnswer] = useState(() =>
    savedAnswer?.submission.type === 'text_input'
      ? savedAnswer.submission.answer
      : '',
  );
  const [verdict, setVerdict] = useState<Verdict>(() =>
    verdictFromSaved(savedAnswer),
  );
  const [revealedAnswers, setRevealedAnswers] = useState<string[] | null>(null);

  const restore = useCallback((saved: SavedBlockAnswer) => {
    if (saved.submission.type !== 'text_input') return;
    setAnswer(saved.submission.answer);
    setVerdict(saved.isCorrect ? 'correct' : 'incorrect');
  }, []);
  const markTouched = useSavedAnswerRestore(savedAnswer, restore);

  const onChange = (value: string) => {
    markTouched();
    setAnswer(value);
    setVerdict(null);
    check.reset();
  };

  const runCheck = () => {
    const trimmed = answer.trim();
    if (!trimmed) return;
    check.mutate(
      { blockId: block.id, payload: { type: 'text_input', answer } },
      { onSuccess: ({ isCorrect }) => setVerdict(isCorrect ? 'correct' : 'incorrect') },
    );
  };

  const runReveal = () => {
    reveal.mutate(
      { blockId: block.id },
      {
        onSuccess: (revealed) => {
          if (revealed.type === 'text_input') {
            setRevealedAnswers(revealed.answers);
          }
        },
      },
    );
  };

  return (
    <LearnerBlock>
      <Input
        value={answer}
        disabled={!canAnswer}
        placeholder={t('answers.textPlaceholder')}
        aria-label={t('answers.textTitle')}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (canAnswer && e.key === 'Enter') {
            e.preventDefault();
            runCheck();
          }
        }}
      />

      {block.caseSensitive ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t('answers.caseSensitiveHint')}
        </p>
      ) : null}

      {canAnswer ? (
        <AnswerActions
          checkDisabled={answer.trim().length === 0}
          isChecking={check.isPending}
          isRevealing={reveal.isPending}
          onCheck={runCheck}
          onReveal={runReveal}
        />
      ) : (
        <GuestLockedRow />
      )}

      {revealedAnswers ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('answers.revealedTitle')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {revealedAnswers.map((value, idx) => (
              <li
                key={`${value}-${idx}`}
                className="inline-flex items-center rounded-full border border-brand/40 bg-brand/[0.08] px-2.5 py-1 text-xs font-medium text-brand"
              >
                {value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {verdict ? <VerdictRow verdict={verdict} /> : null}
      {check.isError ? <BlockErrorAlert title={t('answers.checkErrorTitle')} /> : null}
      {reveal.isError ? <BlockErrorAlert title={t('answers.revealErrorTitle')} /> : null}
    </LearnerBlock>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared action row                                                          */
/* -------------------------------------------------------------------------- */

type AnswerActionsProps = {
  checkDisabled: boolean;
  isChecking: boolean;
  isRevealing: boolean;
  onCheck: () => void;
  onReveal: () => void;
};

/** «Проверить» (brand) + «Показать ответ» (ghost) action row. */
function AnswerActions({
  checkDisabled,
  isChecking,
  isRevealing,
  onCheck,
  onReveal,
}: AnswerActionsProps) {
  const t = useTranslations('product-reader');
  const busy = isChecking || isRevealing;
  return (
    /* h-11 keeps the controls at the ≥44px touch minimum on phones/tablets;
       lg: drops to the compact pointer height. */
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        onClick={onCheck}
        disabled={checkDisabled || busy}
        className="h-11 gap-1.5 bg-brand px-4 text-brand-foreground hover:bg-brand/90 lg:h-9 lg:px-3"
      >
        {isChecking ? <Loader2Icon className="animate-spin" /> : null}
        {/* Plain string child (not a <span>) so the Button's icon-only
            detection sees text and keeps the full pill width. */}
        {t('answers.check')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onReveal}
        disabled={busy}
        className="h-11 gap-1.5 px-4 text-muted-foreground hover:text-foreground lg:h-9 lg:px-3"
      >
        {isRevealing ? <Loader2Icon className="animate-spin" /> : null}
        {t('answers.reveal')}
      </Button>
    </div>
  );
}
