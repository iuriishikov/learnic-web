'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import {
  CardNumberInput,
  CodeInput,
  DateTimeInput,
  EmailInput,
  FieldRow,
  FileInput,
  HttpsInput,
  MoneyInput,
  NumberSpinnerInput,
  NumberStepperInput,
  PasswordInput,
  PhoneInput,
  TagsInput,
  WebsiteInput,
} from '@/shared/ui/input-extended';

// ────────────────────────────────────────────────────────────────────────────
// Static config (countries & currencies)
// ────────────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'US', label: 'United States', prefix: '+1' },
  { value: 'GB', label: 'United Kingdom', prefix: '+44' },
  { value: 'DE', label: 'Germany', prefix: '+49' },
  { value: 'FR', label: 'France', prefix: '+33' },
  { value: 'RU', label: 'Russia', prefix: '+7' },
  { value: 'JP', label: 'Japan', prefix: '+81' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'RUB', label: 'Russian Ruble' },
  { value: 'JPY', label: 'Japanese Yen' },
];

// ────────────────────────────────────────────────────────────────────────────
// State definitions for the matrix
// ────────────────────────────────────────────────────────────────────────────

type RowKind =
  | 'empty'
  | 'filled'
  | 'focused'
  | 'disabled'
  | 'emptyHint'
  | 'filledHint'
  | 'focusedHint'
  | 'disabledHint'
  | 'errorEmpty'
  | 'errorFilled'
  | 'errorFocused'
  | 'errorDisabled';

type RowConfig = {
  filled: boolean;
  focused: boolean;
  disabled: boolean;
  invalid: boolean;
  hint: boolean;
  error: boolean;
};

function rowConfig(kind: RowKind): RowConfig {
  switch (kind) {
    case 'empty':
      return { filled: false, focused: false, disabled: false, invalid: false, hint: false, error: false };
    case 'filled':
      return { filled: true, focused: false, disabled: false, invalid: false, hint: false, error: false };
    case 'focused':
      return { filled: true, focused: true, disabled: false, invalid: false, hint: false, error: false };
    case 'disabled':
      return { filled: false, focused: false, disabled: true, invalid: false, hint: false, error: false };
    case 'emptyHint':
      return { filled: false, focused: false, disabled: false, invalid: false, hint: true, error: false };
    case 'filledHint':
      return { filled: true, focused: false, disabled: false, invalid: false, hint: true, error: false };
    case 'focusedHint':
      return { filled: true, focused: true, disabled: false, invalid: false, hint: true, error: false };
    case 'disabledHint':
      return { filled: false, focused: false, disabled: true, invalid: false, hint: true, error: false };
    case 'errorEmpty':
      return { filled: false, focused: false, disabled: false, invalid: true, hint: false, error: true };
    case 'errorFilled':
      return { filled: true, focused: false, disabled: false, invalid: true, hint: false, error: true };
    case 'errorFocused':
      return { filled: true, focused: true, disabled: false, invalid: true, hint: false, error: true };
    case 'errorDisabled':
      return { filled: false, focused: false, disabled: true, invalid: true, hint: false, error: true };
  }
}

const ROW_GROUPS: Array<{ key: string; rows: RowKind[] }> = [
  { key: 'default', rows: ['empty', 'filled', 'focused', 'disabled'] },
  { key: 'hint', rows: ['emptyHint', 'filledHint', 'focusedHint', 'disabledHint'] },
  { key: 'error', rows: ['errorEmpty', 'errorFilled', 'errorFocused', 'errorDisabled'] },
];

// ────────────────────────────────────────────────────────────────────────────
// Section helpers
// ────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: React.ReactNode;
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
      {eyebrow ? (
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-brand">
          {eyebrow}
        </span>
      ) : null}
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
// Cell renderer — given (variant, row), produce the right input + label
// ────────────────────────────────────────────────────────────────────────────

type VariantKey =
  | 'website'
  | 'password'
  | 'date'
  | 'numberStepper'
  | 'numberSpinner'
  | 'verificationCode'
  | 'uploadFile'
  | 'email'
  | 'phone'
  | 'saleAmount'
  | 'httpsWebsite'
  | 'cardNumber'
  | 'tags';

type Texts = {
  labels: Record<VariantKey, string>;
  examples: {
    website: string;
    password: string;
    date: string;
    number: string;
    verificationCode: string;
    fileName: string;
    email: string;
    phone: string;
    phonePlaceholder: string;
    amount: string;
    amountPlaceholder: string;
    httpsWebsite: string;
    cardNumber: string;
    cardNumberPlaceholder: string;
  };
  hint: string;
  fileHint: string;
  passwordHint: string;
  errorMessage: string;
  uploadFailed: string;
  copy: string;
  browse: string;
  helpTooltips: Record<VariantKey, string>;
  defaultTags: string[];
};

function renderControl(
  variant: VariantKey,
  cfg: RowConfig,
  texts: Texts,
  idPrefix: string,
) {
  const { filled, focused, disabled, invalid } = cfg;
  const common = {
    disabled,
    invalid,
    previewFocused: focused,
    helpTooltip: texts.helpTooltips[variant],
  };
  switch (variant) {
    case 'website':
      return (
        <WebsiteInput
          {...common}
          value={filled ? texts.examples.website : ''}
          placeholder={texts.examples.website}
          copyLabel={texts.copy}
          readOnly
        />
      );
    case 'password':
      return (
        <PasswordInput
          {...common}
          value={filled ? texts.examples.password : ''}
          placeholder="••••••••••••"
          readOnly
        />
      );
    case 'date':
      return (
        <DateTimeInput
          {...common}
          value={filled ? texts.examples.date : ''}
          readOnly
        />
      );
    case 'numberStepper':
      return (
        <NumberStepperInput
          {...common}
          value={filled ? 1080 : undefined}
          placeholder={filled ? undefined : '—'}
        />
      );
    case 'numberSpinner':
      return (
        <NumberSpinnerInput
          {...common}
          value={filled ? 1080 : undefined}
          placeholder={filled ? undefined : '—'}
        />
      );
    case 'verificationCode':
      return <CodeInput {...common} value={filled ? '4680' : ''} length={4} />;
    case 'uploadFile':
      return (
        <FileInput
          {...common}
          fileName={filled ? texts.examples.fileName : ''}
          browseLabel={texts.browse}
          id={`${idPrefix}-file`}
        />
      );
    case 'email':
      return (
        <EmailInput
          {...common}
          value={filled ? texts.examples.email : ''}
          placeholder={texts.examples.email}
          readOnly
        />
      );
    case 'phone':
      return (
        <PhoneInput
          {...common}
          countries={COUNTRIES}
          defaultCountry="US"
          value={filled ? texts.examples.phone : ''}
          placeholder={texts.examples.phonePlaceholder}
          readOnly
        />
      );
    case 'saleAmount':
      return (
        <MoneyInput
          {...common}
          currencies={CURRENCIES}
          defaultCurrency="USD"
          value={filled ? texts.examples.amount : ''}
          placeholder={texts.examples.amountPlaceholder}
          readOnly
        />
      );
    case 'httpsWebsite':
      return (
        <HttpsInput
          {...common}
          value={filled ? texts.examples.httpsWebsite : ''}
          placeholder={texts.examples.httpsWebsite}
          readOnly
        />
      );
    case 'cardNumber':
      return (
        <CardNumberInput
          {...common}
          value={filled ? texts.examples.cardNumber : ''}
          placeholder={texts.examples.cardNumberPlaceholder}
          readOnly
        />
      );
    case 'tags':
      return (
        <TagsInput
          {...common}
          values={filled ? texts.defaultTags : []}
          placeholder="Add tag"
        />
      );
  }
}

function hintFor(variant: VariantKey, texts: Texts): string {
  if (variant === 'uploadFile') return texts.fileHint;
  if (variant === 'password') return texts.passwordHint;
  return texts.hint;
}

function errorFor(variant: VariantKey, texts: Texts): string {
  if (variant === 'uploadFile') return texts.uploadFailed;
  if (variant === 'password') return texts.passwordHint;
  return texts.errorMessage;
}

// ────────────────────────────────────────────────────────────────────────────
// Showcase grid — uses CSS grid so legend column and variant columns share
// row tracks. Each row group (default / hint / error) is its own grid, so
// the row heights inside a group are uniform (no awkward gaps between rows
// of different content sizes).
// ────────────────────────────────────────────────────────────────────────────

function ShowcaseGridGroup({
  groupKey,
  rows,
  variants,
  texts,
  tStates,
  groupLabel,
}: {
  groupKey: string;
  rows: RowKind[];
  variants: VariantKey[];
  texts: Texts;
  tStates: (key: RowKind) => string;
  groupLabel: string;
}) {
  // Layout: a CSS grid with `auto` legend column + N fixed-width variant
  // columns. Each row in `rows` produces one grid row containing the
  // legend cell followed by N variant cells. Items in the same row stretch
  // to a uniform height because they share the row track.
  const columns = `160px repeat(${variants.length}, 280px)`;
  return (
    <div className="flex flex-col gap-3">
      <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
        {groupLabel}
      </div>
      <div
        className="grid items-start gap-x-6 gap-y-5"
        style={{ gridTemplateColumns: columns }}
      >
        {rows.flatMap((row, rowIdx) => {
          const cfg = rowConfig(row);
          const cells: React.ReactNode[] = [];
          // Legend cell — aligned to the top of the input itself (after the
          // label row), so the state label sits visually next to the input.
          cells.push(
            <div
              key={`legend-${groupKey}-${row}`}
              className="self-stretch flex items-center pt-[28px]"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {tStates(row)}
              </span>
            </div>,
          );
          variants.forEach((variant) => {
            cells.push(
              <FieldRow
                key={`${variant}-${row}-${rowIdx}`}
                id={`${variant}-${row}-${rowIdx}`}
                label={texts.labels[variant]}
                required
                hint={cfg.hint ? hintFor(variant, texts) : undefined}
                error={cfg.error ? errorFor(variant, texts) : undefined}
              >
                {renderControl(variant, cfg, texts, `${variant}-${row}-${rowIdx}`)}
              </FieldRow>,
            );
          });
          return cells;
        })}
      </div>
    </div>
  );
}

function ShowcaseGrid({
  variants,
  texts,
  tStates,
  groupLabels,
}: {
  variants: VariantKey[];
  texts: Texts;
  tStates: (key: RowKind) => string;
  groupLabels: { default: string; hint: string; error: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6"
    >
      <div className="overflow-x-auto -mx-4 md:-mx-6">
        <div className="flex w-max flex-col gap-8 px-4 md:px-6">
          {ROW_GROUPS.map((g) => (
            <ShowcaseGridGroup
              key={g.key}
              groupKey={g.key}
              rows={g.rows}
              variants={variants}
              texts={texts}
              tStates={tStates}
              groupLabel={
                g.key === 'default'
                  ? groupLabels.default
                  : g.key === 'hint'
                    ? groupLabels.hint
                    : groupLabels.error
              }
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Interactive playground
// ────────────────────────────────────────────────────────────────────────────

function InteractivePlayground({
  texts,
  tPlay,
}: {
  texts: Texts;
  tPlay: (key: 'website' | 'password' | 'tags' | 'amount' | 'code') => string;
}) {
  const [website, setWebsite] = React.useState('www.untitledui.com');
  const [password, setPassword] = React.useState('hunter2-secret');
  const [date, setDate] = React.useState('04/16/2028 – 10:30 AM');
  const [stepper, setStepper] = React.useState<number | null>(1080);
  const [spinner, setSpinner] = React.useState<number | null>(42);
  const [code, setCode] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [email, setEmail] = React.useState('olivia@untitledui.com');
  const [phone, setPhone] = React.useState('+1 (555) 000-0000');
  const [country, setCountry] = React.useState('US');
  const [amount, setAmount] = React.useState('1,000.00');
  const [currency, setCurrency] = React.useState('USD');
  const [https, setHttps] = React.useState('www.untitledui.com');
  const [card, setCard] = React.useState('1234 1234 1234 1234');
  const [tags, setTags] = React.useState<string[]>(['Design', 'Marketing']);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 md:p-7 lg:grid-cols-3"
    >
      <FieldRow id="play-website" label={texts.labels.website} required hint={tPlay('website')}>
        <WebsiteInput
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          copyLabel={texts.copy}
          helpTooltip={texts.helpTooltips.website}
        />
      </FieldRow>

      <FieldRow id="play-password" label={texts.labels.password} required hint={tPlay('password')}>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helpTooltip={texts.helpTooltips.password}
        />
      </FieldRow>

      <FieldRow id="play-date" label={texts.labels.date} required hint={texts.hint}>
        <DateTimeInput
          value={date}
          onChange={(e) => setDate(e.target.value)}
          helpTooltip={texts.helpTooltips.date}
        />
      </FieldRow>

      <FieldRow id="play-stepper" label={texts.labels.numberStepper} required hint={texts.hint}>
        <NumberStepperInput
          value={stepper ?? undefined}
          onValueChange={setStepper}
          min={0}
          max={9999}
        />
      </FieldRow>

      <FieldRow id="play-spinner" label={texts.labels.numberSpinner} required hint={texts.hint}>
        <NumberSpinnerInput
          value={spinner ?? undefined}
          onValueChange={setSpinner}
          min={0}
          max={9999}
        />
      </FieldRow>

      <FieldRow id="play-code" label={texts.labels.verificationCode} required hint={tPlay('code')}>
        <CodeInput value={code} onValueChange={setCode} length={4} />
      </FieldRow>

      <FieldRow id="play-file" label={texts.labels.uploadFile} required hint={texts.fileHint}>
        <FileInput
          fileName={fileName}
          onFileSelect={(f) => setFileName(f?.name ?? '')}
          browseLabel={texts.browse}
          id="play-file-input"
          helpTooltip={texts.helpTooltips.uploadFile}
        />
      </FieldRow>

      <FieldRow id="play-email" label={texts.labels.email} required hint={texts.hint}>
        <EmailInput
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helpTooltip={texts.helpTooltips.email}
        />
      </FieldRow>

      <FieldRow id="play-phone" label={texts.labels.phone} required hint={texts.hint}>
        <PhoneInput
          countries={COUNTRIES}
          country={country}
          onCountryChange={setCountry}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helpTooltip={texts.helpTooltips.phone}
        />
      </FieldRow>

      <FieldRow id="play-amount" label={texts.labels.saleAmount} required hint={tPlay('amount')}>
        <MoneyInput
          currencies={CURRENCIES}
          currency={currency}
          onCurrencyChange={setCurrency}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helpTooltip={texts.helpTooltips.saleAmount}
        />
      </FieldRow>

      <FieldRow id="play-https" label={texts.labels.httpsWebsite} required hint={texts.hint}>
        <HttpsInput
          value={https}
          onChange={(e) => setHttps(e.target.value)}
          helpTooltip={texts.helpTooltips.httpsWebsite}
        />
      </FieldRow>

      <FieldRow id="play-card" label={texts.labels.cardNumber} required hint={texts.hint}>
        <CardNumberInput
          value={card}
          onChange={(e) => setCard(e.target.value)}
          helpTooltip={texts.helpTooltips.cardNumber}
        />
      </FieldRow>

      <FieldRow id="play-tags" label={texts.labels.tags} required hint={tPlay('tags')}>
        <TagsInput
          values={tags}
          onValuesChange={setTags}
          helpTooltip={texts.helpTooltips.tags}
        />
      </FieldRow>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function InputDemoView() {
  const t = useTranslations('input-demo');
  const tLabels = useTranslations('input-demo.labels');
  const tExamples = useTranslations('input-demo.examples');
  const tActions = useTranslations('input-demo.actions');
  const tStates = useTranslations('input-demo.states');
  const tPlay = useTranslations('input-demo.playground');
  const tTips = useTranslations('input-demo.helpTooltips');

  const defaultTags = React.useMemo(() => {
    const raw = (t.raw('defaultTags') as unknown);
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const texts: Texts = React.useMemo(
    () => ({
      labels: {
        website: tLabels('website'),
        password: tLabels('password'),
        date: tLabels('date'),
        numberStepper: tLabels('numberStepper'),
        numberSpinner: tLabels('numberSpinner'),
        verificationCode: tLabels('verificationCode'),
        uploadFile: tLabels('uploadFile'),
        email: tLabels('email'),
        phone: tLabels('phone'),
        saleAmount: tLabels('saleAmount'),
        httpsWebsite: tLabels('httpsWebsite'),
        cardNumber: tLabels('cardNumber'),
        tags: tLabels('tags'),
      },
      examples: {
        website: tExamples('website'),
        password: tExamples('password'),
        date: tExamples('date'),
        number: tExamples('number'),
        verificationCode: tExamples('verificationCode'),
        fileName: tExamples('fileName'),
        email: tExamples('email'),
        phone: tExamples('phone'),
        phonePlaceholder: tExamples('phonePlaceholder'),
        amount: tExamples('amount'),
        amountPlaceholder: tExamples('amountPlaceholder'),
        httpsWebsite: tExamples('httpsWebsite'),
        cardNumber: tExamples('cardNumber'),
        cardNumberPlaceholder: tExamples('cardNumberPlaceholder'),
      },
      hint: t('hint'),
      fileHint: t('fileHint'),
      passwordHint: t('passwordHint'),
      errorMessage: t('errorMessage'),
      uploadFailed: t('uploadFailed'),
      copy: tActions('copy'),
      browse: tActions('browse'),
      helpTooltips: {
        website: tTips('website'),
        password: tTips('password'),
        date: tTips('date'),
        numberStepper: tTips('numberStepper'),
        numberSpinner: tTips('numberSpinner'),
        verificationCode: tTips('verificationCode'),
        uploadFile: tTips('uploadFile'),
        email: tTips('email'),
        phone: tTips('phone'),
        saleAmount: tTips('saleAmount'),
        httpsWebsite: tTips('httpsWebsite'),
        cardNumber: tTips('cardNumber'),
        tags: tTips('tags'),
      },
      defaultTags,
    }),
    [t, tLabels, tExamples, tActions, tTips, defaultTags],
  );

  const group1: VariantKey[] = [
    'website',
    'password',
    'date',
    'numberStepper',
    'numberSpinner',
    'verificationCode',
    'uploadFile',
  ];
  const group2: VariantKey[] = [
    'email',
    'phone',
    'saleAmount',
    'httpsWebsite',
    'cardNumber',
    'tags',
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Live"
          title={t('sections.interactiveTitle')}
          description={t('sections.interactiveDescription')}
        />
        <InteractivePlayground texts={texts} tPlay={(key) => tPlay(key)} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Showcase"
          title={t('sections.showcaseTitle')}
          description={t('sections.showcaseDescription')}
        />
        <ShowcaseGrid
          variants={group1}
          texts={texts}
          tStates={(k) => tStates(k)}
          groupLabels={{
            default: t('groups.default'),
            hint: t('groups.hint'),
            error: t('groups.error'),
          }}
        />
        <ShowcaseGrid
          variants={group2}
          texts={texts}
          tStates={(k) => tStates(k)}
          groupLabels={{
            default: t('groups.default'),
            hint: t('groups.hint'),
            error: t('groups.error'),
          }}
        />
      </section>
    </main>
  );
}
