'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type Ref,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { TextInput } from '@/shared/ui/input-extended';
import {
  NumberField,
  NumberFieldAddon,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/shared/ui/number-field';
import { RichEditor } from '@/shared/ui/rich-editor';

import {
  useChangeProductDescriptionMutation,
  useChangeProductDurationMutation,
  useChangeProductNameMutation,
} from '../api/use-product-mutations';
import { useProductPermissions } from '../api/use-product-permissions';
import { EditorRow, EditorSection } from './editor-row';

const SAVE_DEBOUNCE_MS = 600;
const DURATION_MIN = 1;
const DURATION_MAX = 10000;
const DURATION_STEP = 1;

type ProductDescriptionSectionProps = {
  productId: string;
  title: string;
  description: string;
  durationHours: number;
  /**
   * Increment from a parent surface (e.g. an "Edit" CTA elsewhere in the page)
   * to focus and select the name input. Each new value re-runs the focus
   * effect, so the same parent action can trigger focus repeatedly.
   */
  focusNameToken?: number;
};

export function ProductDescriptionSection({
  productId,
  title,
  description,
  durationHours,
  focusNameToken,
}: ProductDescriptionSectionProps) {
  const t = useTranslations('teach-products.editor.description');
  const tEditor = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const perms = useProductPermissions(productId);
  const readOnly = !perms.canEditDescription;
  const insufficientTitle = tEditor('insufficientPermissions');

  useEffect(() => {
    if (focusNameToken === undefined || focusNameToken === 0) return;
    const input = nameInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [focusNameToken]);

  return (
    <motion.div
      key="description-section"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      <EditorSection title={t('title')} description={t('description')}>
        <EditorRow
          label={t('nameTitle')}
          description={t('nameHint')}
          required
        >
          <NameField
            productId={productId}
            title={title}
            inputRef={nameInputRef}
            readOnly={readOnly}
            disabledTitle={insufficientTitle}
          />
        </EditorRow>
        <EditorRow
          label={t('duration.title')}
          description={t('duration.hint')}
        >
          <HoursStepper
            productId={productId}
            durationHours={durationHours}
            readOnly={readOnly}
            disabledTitle={insufficientTitle}
          />
        </EditorRow>
        <EditorRow label={t('bodyTitle')} description={t('bodyHint')}>
          <DescriptionEditor
            productId={productId}
            description={description}
            readOnly={readOnly}
          />
        </EditorRow>
      </EditorSection>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Name field                                                                 */
/* -------------------------------------------------------------------------- */

function NameField({
  productId,
  title,
  inputRef,
  readOnly,
  disabledTitle,
}: {
  productId: string;
  title: string;
  inputRef?: Ref<HTMLInputElement>;
  readOnly?: boolean;
  disabledTitle?: string;
}) {
  const t = useTranslations('teach-products.editor.description');
  const update = useChangeProductNameMutation(productId);

  // Save on every keystroke, debounced. Empty / whitespace-only values are
  // skipped — the title is required.
  const flush = useDebouncedCommit(title, (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    update.mutate({ value: trimmed });
  });

  return (
    <TextInput
      // Re-seed only when navigating to a different product, not on every
      // optimistic title update — the user is the source of truth while typing.
      key={productId}
      ref={inputRef}
      defaultValue={title}
      onChange={(event) => flush(event.target.value)}
      placeholder={t('namePlaceholder')}
      maxLength={200}
      disabled={readOnly}
      title={readOnly ? disabledTitle : undefined}
      className="h-10 text-base"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Description rich editor                                                    */
/* -------------------------------------------------------------------------- */

function DescriptionEditor({
  productId,
  description,
  readOnly,
}: {
  productId: string;
  description: string;
  readOnly?: boolean;
}) {
  const t = useTranslations('teach-products.editor.description');
  const update = useChangeProductDescriptionMutation(productId);

  const flush = useDebouncedCommit(description, (value) => {
    if (!value.trim()) return;
    update.mutate({ value });
  });

  return (
    <RichEditor
      // The editor seeds itself from `defaultValue` on mount and owns its
      // state from then on. Re-keying on `productId` resets if the user
      // navigates between products without unmounting the section.
      key={productId}
      defaultValue={description}
      onChange={readOnly ? undefined : flush}
      editable={!readOnly}
      placeholder={t('placeholder')}
      editorClassName="min-h-[260px]"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Hours stepper                                                              */
/* -------------------------------------------------------------------------- */

function HoursStepper({
  productId,
  durationHours,
  readOnly,
  disabledTitle,
}: {
  productId: string;
  durationHours: number;
  readOnly?: boolean;
  disabledTitle?: string;
}) {
  const t = useTranslations('teach-products.editor.description.duration');
  const update = useChangeProductDurationMutation(productId);

  // Base UI's NumberField owns the input's text and parsing internally; we
  // only need to react when the value is *committed* (blur, Enter, button
  // click, scrub end). `onValueChange` would fire on every keystroke and
  // flood the API.
  const handleCommit = useCallback(
    (next: number | null) => {
      if (next === null || next === durationHours) return;
      update.mutate({ value: next });
    },
    [durationHours, update],
  );

  return (
    <div className="flex flex-col gap-2">
      <NumberField
        // Keying on the server value re-seeds the field after an external
        // change (rollback, WS event, etc.) without us having to wire a
        // controlled value/onValueChange pair.
        key={durationHours}
        defaultValue={durationHours}
        min={DURATION_MIN}
        max={DURATION_MAX}
        step={DURATION_STEP}
        largeStep={10}
        smallStep={1}
        onValueCommitted={handleCommit}
        disabled={readOnly}
      >
        <NumberFieldGroup
          className="w-full max-w-[280px]"
          title={readOnly ? disabledTitle : undefined}
        >
          <NumberFieldDecrement aria-label={t('decrement')} />
          <NumberFieldInput
            aria-label={t('label')}
            className="text-center text-base font-medium"
          />
          <NumberFieldAddon align="inline-end">
            {t('suffix')}
          </NumberFieldAddon>
          <NumberFieldIncrement aria-label={t('increment')} />
        </NumberFieldGroup>
      </NumberField>
      <p className="text-xs leading-snug text-muted-foreground">
        {t('range', { min: DURATION_MIN, max: DURATION_MAX })}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Description debounce                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Buffers high-frequency edits and flushes them at most once per
 * `SAVE_DEBOUNCE_MS`. Pending edits are flushed on unmount and whenever the
 * server-side value (`serverValue`) is replaced — the latter prevents a stale
 * client edit from clobbering a remote update that arrived while the user was
 * mid-typing.
 */
function useDebouncedCommit(
  serverValue: string,
  commit: (value: string) => void,
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
  }, []);

  return useCallback((next: string) => {
    pendingRef.current = next;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value !== null && value !== serverValueRef.current) {
        commitRef.current(value);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);
}
