'use client';

import * as React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Switch, SwitchField, type SwitchSize } from '@/shared/ui/switch';
import { cn } from '@/shared/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Types

type StateKey = 'off' | 'on' | 'focused' | 'disabledOn';

const STATES: StateKey[] = ['off', 'on', 'focused', 'disabledOn'];
const SIZES: SwitchSize[] = ['sm', 'default'];

type StateConfig = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  previewFocused?: boolean;
};

function configFor(state: StateKey): StateConfig {
  switch (state) {
    case 'off':
      return { checked: false };
    case 'on':
      return { checked: true };
    case 'focused':
      return { checked: false, previewFocused: true };
    case 'disabledOn':
      return { checked: true, disabled: true };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Layout helpers

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
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      ) : null}
    </motion.header>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// State × size matrix (no labels)

function MatrixShowcase() {
  const tStates = useTranslations('switch-demo.states');
  const tSizes = useTranslations('switch-demo.sizes');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7"
    >
      <div className="grid grid-cols-[auto_repeat(2,minmax(0,1fr))] gap-x-8 gap-y-5 md:gap-x-14">
        <div />
        {SIZES.map((size) => (
          <div
            key={size}
            className="border-b border-border pb-2 text-xs font-semibold text-foreground"
          >
            {tSizes(size)}
          </div>
        ))}

        {STATES.map((state, rowIndex) => (
          <React.Fragment key={state}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
              className="flex items-center"
            >
              <StateLabel>{tStates(state)}</StateLabel>
            </motion.div>
            {SIZES.map((size, colIndex) => (
              <motion.div
                key={`${state}-${size}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.35,
                  delay: rowIndex * 0.05 + colIndex * 0.05,
                  type: 'spring',
                  stiffness: 380,
                  damping: 24,
                }}
                className="flex items-center"
              >
                <Switch size={size} {...configFor(state)} aria-label={tStates(state)} />
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SwitchField (with label + description) matrix

function FieldsShowcase() {
  const t = useTranslations('switch-demo');
  const tStates = useTranslations('switch-demo.states');
  const tSizes = useTranslations('switch-demo.sizes');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 md:p-7"
    >
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-foreground">
              {tSizes(size)}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {STATES.map((state, i) => (
              <motion.div
                key={`${size}-${state}`}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <SwitchField
                  size={size}
                  label={t('remember.label')}
                  description={t('remember.description')}
                  aria-label={`${tStates(state)} – ${tSizes(size)}`}
                  {...configFor(state)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Interactive playground

function InteractivePlayground() {
  const t = useTranslations('switch-demo.playground');
  const reduce = useReducedMotion();

  const [notifications, setNotifications] = React.useState(true);
  const [email, setEmail] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const [size, setSize] = React.useState<SwitchSize>('default');

  const items: Array<{
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }> = [
    {
      id: 'notifications',
      label: t('items.notifications.label'),
      description: t('items.notifications.description'),
      checked: notifications,
      onChange: setNotifications,
    },
    {
      id: 'email',
      label: t('items.email.label'),
      description: t('items.email.description'),
      checked: email,
      onChange: setEmail,
    },
    {
      id: 'marketing',
      label: t('items.marketing.label'),
      description: t('items.marketing.description'),
      checked: marketing,
      onChange: setMarketing,
    },
  ];

  const activeCount = items.filter((item) => item.checked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_auto] md:p-7"
    >
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={!reduce}
            transition={{
              layout: { type: 'spring', stiffness: 420, damping: 32 },
            }}
            className={cn(
              'flex items-start justify-between gap-6 rounded-xl border border-border/60 px-4 py-3 transition-colors',
              item.checked
                ? 'border-brand/40 bg-brand/5'
                : 'bg-background hover:bg-muted/40',
            )}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.description}
              </span>
            </span>
            <Switch
              size={size}
              checked={item.checked}
              onCheckedChange={item.onChange}
              aria-label={item.label}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:w-56">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {t('summary.title')}
          </p>
          <div className="flex items-baseline gap-1.5">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={activeCount}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="text-3xl font-semibold text-brand tabular-nums"
              >
                {activeCount}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-muted-foreground">
              {t('summary.of', { total: items.length })}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {t('sizeControl')}
          </p>
          <div className="flex items-center gap-3">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  size === s
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {s === 'sm' ? 'sm' : 'default'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function SwitchDemoView() {
  const t = useTranslations('switch-demo');

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          Switch
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
          title={t('interactive.title')}
          description={t('interactive.description')}
        />
        <InteractivePlayground />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Showcase"
          title={t('matrix.title')}
          description={t('matrix.description')}
        />
        <MatrixShowcase />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Showcase"
          title={t('fields.title')}
          description={t('fields.description')}
        />
        <FieldsShowcase />
      </section>
    </main>
  );
}
