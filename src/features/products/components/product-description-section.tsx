'use client';

import { ClockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
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
} from '../api/use-product-mutations';

const SAVE_DEBOUNCE_MS = 600;
const DURATION_MIN = 1;
const DURATION_MAX = 10000;
const DURATION_STEP = 1;

type ProductDescriptionSectionProps = {
  productId: string;
  description: string;
  durationHours: number;
};

export function ProductDescriptionSection({
  productId,
  description,
  durationHours,
}: ProductDescriptionSectionProps) {
  const t = useTranslations('teach-products.editor.description');
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key="description-section"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-1.5 px-1">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('description')}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
              <ClockIcon className="size-4" />
            </span>
            {t('duration.title')}
          </CardTitle>
          <CardDescription>{t('duration.hint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursStepper
            productId={productId}
            durationHours={durationHours}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('bodyTitle')}</CardTitle>
          <CardDescription>{t('bodyHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DescriptionEditor
            productId={productId}
            description={description}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Description rich editor                                                    */
/* -------------------------------------------------------------------------- */

function DescriptionEditor({
  productId,
  description,
}: {
  productId: string;
  description: string;
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
      onChange={flush}
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
}: {
  productId: string;
  durationHours: number;
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
      >
        <NumberFieldGroup className="w-full max-w-[280px]">
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
