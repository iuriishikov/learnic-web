'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import {
  DescriptionTextarea,
  TagsTextarea,
  TagsTextareaBelow,
  TextareaFieldRow,
} from '@/shared/ui/textarea-extended';

// ────────────────────────────────────────────────────────────────────────────
// State matrix
// ────────────────────────────────────────────────────────────────────────────

type RowKind =
  | 'empty'
  | 'filled'
  | 'focused'
  | 'disabled'
  | 'errorEmpty'
  | 'errorFilled';

type RowConfig = {
  filled: boolean;
  focused: boolean;
  disabled: boolean;
  invalid: boolean;
  hasError: boolean;
};

function rowConfig(kind: RowKind): RowConfig {
  switch (kind) {
    case 'empty':
      return { filled: false, focused: false, disabled: false, invalid: false, hasError: false };
    case 'filled':
      return { filled: true, focused: false, disabled: false, invalid: false, hasError: false };
    case 'focused':
      return { filled: true, focused: true, disabled: false, invalid: false, hasError: false };
    case 'disabled':
      return { filled: false, focused: false, disabled: true, invalid: false, hasError: false };
    case 'errorEmpty':
      return { filled: false, focused: false, disabled: false, invalid: true, hasError: true };
    case 'errorFilled':
      return { filled: true, focused: false, disabled: false, invalid: true, hasError: true };
  }
}

type VariantKey = 'description' | 'tagsInside' | 'tagsBelow';

const ROWS: RowKind[] = [
  'empty',
  'filled',
  'focused',
  'errorEmpty',
  'errorFilled',
  'disabled',
];

const VARIANTS: VariantKey[] = ['description', 'tagsInside', 'tagsBelow'];

// ────────────────────────────────────────────────────────────────────────────
// Section header
// ────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1.5"
    >
      <h2 className="text-xl font-semibold text-foreground md:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      ) : null}
    </motion.header>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Cell renderer
// ────────────────────────────────────────────────────────────────────────────

type Texts = {
  labels: Record<VariantKey, string>;
  placeholders: { description: string; tag: string };
  examples: { description: string; tags: string[] };
  hint: string;
  errorMessage: string;
  helpTooltips: Record<VariantKey, string>;
  removeLabel: string;
};

function renderControl(
  variant: VariantKey,
  cfg: RowConfig,
  texts: Texts,
) {
  const { filled, focused, disabled, invalid } = cfg;
  switch (variant) {
    case 'description':
      return (
        <DescriptionTextarea
          invalid={invalid}
          previewFocused={focused}
          disabled={disabled}
          placeholder={texts.placeholders.description}
          defaultValue={filled ? texts.examples.description : ''}
          readOnly
        />
      );
    case 'tagsInside':
      return (
        <TagsTextarea
          invalid={invalid}
          previewFocused={focused}
          disabled={disabled}
          defaultValues={filled ? texts.examples.tags : []}
          placeholder={texts.placeholders.tag}
          removeLabel={texts.removeLabel}
        />
      );
    case 'tagsBelow':
      return (
        <TagsTextareaBelow
          invalid={invalid}
          previewFocused={focused}
          disabled={disabled}
          defaultValues={filled ? texts.examples.tags : []}
          placeholder={texts.placeholders.tag}
          removeLabel={texts.removeLabel}
        />
      );
  }
}

function MatrixCell({
  variant,
  kind,
  texts,
}: {
  variant: VariantKey;
  kind: RowKind;
  texts: Texts;
}) {
  const cfg = rowConfig(kind);
  return (
    <TextareaFieldRow
      label={texts.labels[variant]}
      required
      helpTooltip={texts.helpTooltips[variant]}
      hint={cfg.hasError ? undefined : texts.hint}
      error={cfg.hasError ? texts.errorMessage : undefined}
    >
      {renderControl(variant, cfg, texts)}
    </TextareaFieldRow>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Playground (live, interactive)
// ────────────────────────────────────────────────────────────────────────────

function Playground({ texts }: { texts: Texts }) {
  const [description, setDescription] = React.useState('');
  const [tagsInside, setTagsInside] = React.useState<string[]>(['Design']);
  const [tagsBelow, setTagsBelow] = React.useState<string[]>(['Marketing']);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 gap-6 md:grid-cols-3"
    >
      <TextareaFieldRow
        id="play-description"
        label={texts.labels.description}
        required
        helpTooltip={texts.helpTooltips.description}
        hint={texts.hint}
      >
        <DescriptionTextarea
          id="play-description"
          placeholder={texts.placeholders.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </TextareaFieldRow>

      <TextareaFieldRow
        label={texts.labels.tagsInside}
        required
        helpTooltip={texts.helpTooltips.tagsInside}
        hint={texts.hint}
      >
        <TagsTextarea
          values={tagsInside}
          onValuesChange={setTagsInside}
          placeholder={texts.placeholders.tag}
          removeLabel={texts.removeLabel}
        />
      </TextareaFieldRow>

      <TextareaFieldRow
        label={texts.labels.tagsBelow}
        required
        helpTooltip={texts.helpTooltips.tagsBelow}
        hint={texts.hint}
      >
        <TagsTextareaBelow
          values={tagsBelow}
          onValuesChange={setTagsBelow}
          placeholder={texts.placeholders.tag}
          removeLabel={texts.removeLabel}
        />
      </TextareaFieldRow>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// View
// ────────────────────────────────────────────────────────────────────────────

export function TextareaDemoView() {
  const t = useTranslations('textarea-demo');
  const tLabels = useTranslations('textarea-demo.labels');
  const tPlaceholders = useTranslations('textarea-demo.placeholders');
  const tExamples = useTranslations('textarea-demo.examples');
  const tTips = useTranslations('textarea-demo.helpTooltips');
  const tSections = useTranslations('textarea-demo.sections');

  const examplesTags = React.useMemo(() => {
    const raw = tExamples.raw('tags') as unknown;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [tExamples]);

  const texts: Texts = React.useMemo(
    () => ({
      labels: {
        description: tLabels('description'),
        tagsInside: tLabels('tagsInside'),
        tagsBelow: tLabels('tagsBelow'),
      },
      placeholders: {
        description: tPlaceholders('description'),
        tag: tPlaceholders('tag'),
      },
      examples: {
        description: tExamples('description'),
        tags: examplesTags,
      },
      hint: t('hint'),
      errorMessage: t('errorMessage'),
      helpTooltips: {
        description: tTips('description'),
        tagsInside: tTips('tagsInside'),
        tagsBelow: tTips('tagsBelow'),
      },
      removeLabel: t('removeLabel'),
    }),
    [t, tLabels, tPlaceholders, tExamples, tTips, examplesTags],
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl lg:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <section className="flex flex-col gap-6">
        <SectionHeader
          title={tSections('matrix.title')}
          description={tSections('matrix.description')}
        />
        <div className="flex flex-col gap-8">
          {ROWS.map((kind) => (
            <motion.div
              key={kind}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {VARIANTS.map((variant) => (
                <MatrixCell
                  key={variant + kind}
                  variant={variant}
                  kind={kind}
                  texts={texts}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          title={tSections('playground.title')}
          description={tSections('playground.description')}
        />
        <Playground texts={texts} />
      </section>
    </main>
  );
}
