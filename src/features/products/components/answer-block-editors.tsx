'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { PlusIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
// `useEffect` is still referenced by `useStructuralCommit`'s ref-sync.

// All three editors are uncontrolled with respect to server-pushed
// updates: once mounted, they own their local edit state until the
// caller forces a remount by changing ``key`` (typically when the
// underlying block id changes). This avoids the cascading-rerender
// pattern that ``useEffect`` + ``setState`` on prop changes would
// introduce, and matches the trade-off behind ``useDebouncedFlush``
// in ``lesson-blocks.tsx`` — last write wins, no live merge from a
// concurrent collaborator's update.

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';

import {
  CHOICE_BLOCK_MAX_OPTIONS,
  CHOICE_BLOCK_MIN_OPTIONS,
  CHOICE_OPTION_LABEL_MAX_LEN,
  type ChoiceOption,
  TEXT_INPUT_ANSWER_MAX_LEN,
  TEXT_INPUT_MAX_ACCEPTED,
} from '../model/draft';

import type { ChoiceOptionDraftInput } from '../api/blocks';

/* -------------------------------------------------------------------------- */
/* Shared types + helpers                                                     */
/* -------------------------------------------------------------------------- */

// Local editor representation: same shape as the wire-side input
// (label + isCorrect), with an ephemeral local id so React can key
// rows during add/remove without leaking those ids to the server.
// The server mints stable ids on submit.
type LocalOption = ChoiceOptionDraftInput & { _localId: string };

function _localId(): string {
  return Math.random().toString(36).slice(2);
}

function _optionsFromValue(
  options: ChoiceOption[],
  correctIds: ReadonlySet<string>,
): LocalOption[] {
  return options.map((o) => ({
    _localId: o.oid,
    label: o.label,
    isCorrect: correctIds.has(o.oid),
  }));
}

function _emitWire(rows: LocalOption[]): ChoiceOptionDraftInput[] {
  return rows.map((r) => ({ label: r.label, isCorrect: r.isCorrect }));
}

/* -------------------------------------------------------------------------- */
/* Single choice                                                              */
/* -------------------------------------------------------------------------- */

type SingleChoiceBlockEditorProps = {
  blockId: string;
  options: ChoiceOption[];
  correctOptionId: string;
  onChange: (options: ChoiceOptionDraftInput[]) => void;
};

export function SingleChoiceBlockEditor({
  blockId,
  options,
  correctOptionId,
  onChange,
}: SingleChoiceBlockEditorProps) {
  const t = useTranslations('teach-products.editor.answer');
  // Initial state seeded from props once — the parent re-mounts
  // the editor (via ``key={blockId}``) when it wants a fresh seed.
  const [rows, setRows] = useState<LocalOption[]>(() =>
    _optionsFromValue(options, new Set([correctOptionId])),
  );
  void blockId; // remount-via-key handles this; suppress unused-prop lint

  const commit = useStructuralCommit(rows, onChange);

  const updateRow = useCallback((idx: number, patch: Partial<LocalOption>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  }, []);

  const pickCorrect = useCallback(
    (idx: number) => {
      setRows((prev) => {
        const next = prev.map((r, i) => ({ ...r, isCorrect: i === idx }));
        commit(next);
        return next;
      });
    },
    [commit],
  );

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= CHOICE_BLOCK_MAX_OPTIONS) return prev;
      const next = [
        ...prev,
        { _localId: _localId(), label: '', isCorrect: false },
      ];
      return next;
    });
  }, []);

  const removeRow = useCallback(
    (idx: number) => {
      setRows((prev) => {
        if (prev.length <= CHOICE_BLOCK_MIN_OPTIONS) return prev;
        const next = prev.filter((_, i) => i !== idx);
        // If the removed row was the correct one, the new state has
        // zero correct rows — that's an invalid submission. Force
        // the first remaining row to be correct so the block stays
        // valid until the author makes a different choice.
        if (!next.some((r) => r.isCorrect) && next.length > 0) {
          next[0] = { ...next[0], isCorrect: true };
        }
        commit(next);
        return next;
      });
    },
    [commit],
  );

  return (
    <AnswerBlockShell title={t('singleChoice.title')}>
      <ul className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <OptionRow
            key={row._localId}
            label={row.label}
            isCorrect={row.isCorrect}
            mode="radio"
            canRemove={rows.length > CHOICE_BLOCK_MIN_OPTIONS}
            onLabelChange={(label) => updateRow(idx, { label })}
            onLabelCommit={() => commit(rows)}
            onToggleCorrect={() => pickCorrect(idx)}
            onRemove={() => removeRow(idx)}
            placeholder={t('option.placeholder')}
            removeLabel={t('option.remove')}
            correctLabel={t('option.markCorrect')}
          />
        ))}
      </ul>
      {rows.length < CHOICE_BLOCK_MAX_OPTIONS ? (
        <AddRowButton onClick={addRow} label={t('option.add')} />
      ) : null}
    </AnswerBlockShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Multi choice                                                               */
/* -------------------------------------------------------------------------- */

type MultiChoiceBlockEditorProps = {
  blockId: string;
  options: ChoiceOption[];
  correctOptionIds: string[];
  onChange: (options: ChoiceOptionDraftInput[]) => void;
};

export function MultiChoiceBlockEditor({
  blockId,
  options,
  correctOptionIds,
  onChange,
}: MultiChoiceBlockEditorProps) {
  const t = useTranslations('teach-products.editor.answer');
  const [rows, setRows] = useState<LocalOption[]>(() =>
    _optionsFromValue(options, new Set(correctOptionIds)),
  );
  void blockId;

  const commit = useStructuralCommit(rows, onChange);

  const updateRow = useCallback((idx: number, patch: Partial<LocalOption>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  }, []);

  const toggleCorrect = useCallback(
    (idx: number) => {
      setRows((prev) => {
        const next = prev.map((r, i) =>
          i === idx ? { ...r, isCorrect: !r.isCorrect } : r,
        );
        // Enforce "at least one correct" client-side too — the
        // server enforces it but a 422 round-trip is a worse UX
        // than refusing the toggle locally.
        if (!next.some((r) => r.isCorrect)) return prev;
        commit(next);
        return next;
      });
    },
    [commit],
  );

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= CHOICE_BLOCK_MAX_OPTIONS) return prev;
      return [
        ...prev,
        { _localId: _localId(), label: '', isCorrect: false },
      ];
    });
  }, []);

  const removeRow = useCallback(
    (idx: number) => {
      setRows((prev) => {
        if (prev.length <= CHOICE_BLOCK_MIN_OPTIONS) return prev;
        const next = prev.filter((_, i) => i !== idx);
        if (!next.some((r) => r.isCorrect) && next.length > 0) {
          next[0] = { ...next[0], isCorrect: true };
        }
        commit(next);
        return next;
      });
    },
    [commit],
  );

  return (
    <AnswerBlockShell title={t('multiChoice.title')}>
      <ul className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <OptionRow
            key={row._localId}
            label={row.label}
            isCorrect={row.isCorrect}
            mode="checkbox"
            canRemove={rows.length > CHOICE_BLOCK_MIN_OPTIONS}
            onLabelChange={(label) => updateRow(idx, { label })}
            onLabelCommit={() => commit(rows)}
            onToggleCorrect={() => toggleCorrect(idx)}
            onRemove={() => removeRow(idx)}
            placeholder={t('option.placeholder')}
            removeLabel={t('option.remove')}
            correctLabel={t('option.markCorrect')}
          />
        ))}
      </ul>
      {rows.length < CHOICE_BLOCK_MAX_OPTIONS ? (
        <AddRowButton onClick={addRow} label={t('option.add')} />
      ) : null}
    </AnswerBlockShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

type TextInputBlockEditorProps = {
  blockId: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
  onChange: (args: {
    acceptedAnswers: string[];
    caseSensitive: boolean;
    trimWhitespace: boolean;
  }) => void;
};

type TextInputRow = { _localId: string; value: string };

export function TextInputBlockEditor({
  blockId,
  acceptedAnswers,
  caseSensitive,
  trimWhitespace,
  onChange,
}: TextInputBlockEditorProps) {
  const t = useTranslations('teach-products.editor.answer');
  const [rows, setRows] = useState<TextInputRow[]>(() =>
    acceptedAnswers.length === 0
      ? [{ _localId: _localId(), value: '' }]
      : acceptedAnswers.map((v) => ({ _localId: _localId(), value: v })),
  );
  const [caseSens, setCaseSens] = useState(caseSensitive);
  const [trim, setTrim] = useState(trimWhitespace);
  void blockId;

  const commit = useCallback(
    (
      nextRows: TextInputRow[],
      nextCaseSens: boolean,
      nextTrim: boolean,
    ) => {
      onChange({
        acceptedAnswers: nextRows.map((r) => r.value),
        caseSensitive: nextCaseSens,
        trimWhitespace: nextTrim,
      });
    },
    [onChange],
  );

  const updateRow = useCallback((idx: number, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, value } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= TEXT_INPUT_MAX_ACCEPTED) return prev;
      return [...prev, { _localId: _localId(), value: '' }];
    });
  }, []);

  const removeRow = useCallback(
    (idx: number) => {
      setRows((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((_, i) => i !== idx);
        commit(next, caseSens, trim);
        return next;
      });
    },
    [commit, caseSens, trim],
  );

  return (
    <AnswerBlockShell title={t('textInput.title')}>
      <ul className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <li
            key={row._localId}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
          >
            <Input
              value={row.value}
              maxLength={TEXT_INPUT_ANSWER_MAX_LEN}
              placeholder={t('textInput.placeholder')}
              onChange={(e) => updateRow(idx, e.target.value)}
              onBlur={() => commit(rows, caseSens, trim)}
              className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('option.remove')}
                onClick={() => removeRow(idx)}
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {rows.length < TEXT_INPUT_MAX_ACCEPTED ? (
        <AddRowButton onClick={addRow} label={t('textInput.addAnswer')} />
      ) : null}

      <div className="mt-3 flex flex-col gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
        <FlagRow
          label={t('textInput.caseSensitive')}
          checked={caseSens}
          onChange={(checked) => {
            setCaseSens(checked);
            commit(rows, checked, trim);
          }}
        />
        <FlagRow
          label={t('textInput.trimWhitespace')}
          checked={trim}
          onChange={(checked) => {
            setTrim(checked);
            commit(rows, caseSens, checked);
          }}
        />
      </div>
    </AnswerBlockShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function AnswerBlockShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </motion.div>
  );
}

type OptionRowProps = {
  label: string;
  isCorrect: boolean;
  mode: 'radio' | 'checkbox';
  canRemove: boolean;
  onLabelChange: (value: string) => void;
  onLabelCommit: () => void;
  onToggleCorrect: () => void;
  onRemove: () => void;
  placeholder: string;
  removeLabel: string;
  correctLabel: string;
};

function OptionRow({
  label,
  isCorrect,
  mode,
  canRemove,
  onLabelChange,
  onLabelCommit,
  onToggleCorrect,
  onRemove,
  placeholder,
  removeLabel,
  correctLabel,
}: OptionRowProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 transition-colors',
        isCorrect && 'border-brand/40 bg-brand/[0.04]',
      )}
    >
      <button
        type="button"
        role={mode === 'radio' ? 'radio' : 'checkbox'}
        aria-checked={isCorrect}
        aria-label={correctLabel}
        onClick={onToggleCorrect}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center border border-input transition-colors',
          mode === 'radio' ? 'rounded-full' : 'rounded',
          isCorrect && 'border-brand bg-brand text-brand-foreground',
        )}
      >
        {isCorrect ? (
          <span
            aria-hidden
            className={cn(
              mode === 'radio'
                ? 'size-2 rounded-full bg-current'
                : 'size-2.5 rounded-[1px] bg-current',
            )}
          />
        ) : null}
      </button>
      <Input
        value={label}
        maxLength={CHOICE_OPTION_LABEL_MAX_LEN}
        placeholder={placeholder}
        onChange={(e) => onLabelChange(e.target.value)}
        onBlur={onLabelCommit}
        className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={removeLabel}
          onClick={onRemove}
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}

function AddRowButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="mt-2 gap-1.5 self-start text-muted-foreground hover:text-foreground"
    >
      <PlusIcon className="size-3.5" /> {label}
    </Button>
  );
}

function FlagRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
}

/**
 * Commit structural changes (add / remove / radio pick) immediately
 * and label edits on blur. Used by both choice editors. The hook
 * exists mainly to keep the latest ``onChange`` in a ref so callers
 * don't have to memoise it themselves.
 */
function useStructuralCommit(
  // ``_currentRows`` is unused at runtime — kept in the API to make
  // it explicit at call sites that the commit is keyed to the rows
  // a render produced.
  _currentRows: LocalOption[],
  onChange: (options: ChoiceOptionDraftInput[]) => void,
) {
  const ref = useRef(onChange);
  useEffect(() => {
    ref.current = onChange;
  }, [onChange]);
  return useCallback((next: LocalOption[]) => {
    ref.current(_emitWire(next));
  }, []);
}
