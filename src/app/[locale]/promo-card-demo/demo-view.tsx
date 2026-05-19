'use client';

import { PlusIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  PromoCard,
  resetPromoCardDismissal,
  type PromoCardSize,
} from '@/shared/ui/promo-card';
import { Switch } from '@/shared/ui/switch';

// ────────────────────────────────────────────────────────────────────────────
// Storage keys used by the three demo cards on this page.

const KEY_USED_SPACE = 'demo-used-space';
const KEY_WORKSHOP = 'demo-workshop';
const KEY_PLAYGROUND = 'demo-playground';

// ────────────────────────────────────────────────────────────────────────────
// Visual helpers — only the demo needs these; the PromoCard primitive is
// fully agnostic about what you put into its `visual` slot.

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 10,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          className="text-brand"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-foreground tabular-nums">
        {value}%
      </span>
    </div>
  );
}

function PeopleGroup({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const people: Array<{ initials: string; tone: string }> = [
    { initials: 'AB', tone: 'bg-avatar-1' },
    { initials: 'KJ', tone: 'bg-avatar-6' },
    { initials: 'IM', tone: 'bg-avatar-4' },
    { initials: 'RV', tone: 'bg-avatar-2' },
  ];
  const addButtonSize =
    size === 'sm' ? 'size-6' : size === 'lg' ? 'size-10' : 'size-8';
  const addIconSize = size === 'sm' ? 'size-3' : 'size-4';
  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {people.map((p) => (
          <Avatar key={p.initials} size={size}>
            <AvatarFallback
              className={cn('text-avatar-foreground text-xs', p.tone)}
            >
              {p.initials}
            </AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount>+5</AvatarGroupCount>
      </AvatarGroup>
      <button
        type="button"
        aria-label="Invite more"
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
          addButtonSize,
        )}
      >
        <PlusIcon className={addIconSize} aria-hidden />
      </button>
    </div>
  );
}

function LiveBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 border-border bg-background px-2 text-xs font-medium text-foreground"
    >
      <span
        aria-hidden
        className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
      />
      {label}
    </Badge>
  );
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
        <span className="w-fit text-xs font-medium uppercase tracking-[0.12em] text-brand">
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

// ────────────────────────────────────────────────────────────────────────────
// Sections

function ExamplesShowcase() {
  const t = useTranslations('promo-card-demo');
  const [, force] = React.useReducer((x: number) => x + 1, 0);

  function showBoth() {
    resetPromoCardDismissal(KEY_USED_SPACE);
    resetPromoCardDismissal(KEY_WORKSHOP);
    force();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PromoCard
          storageKey={KEY_USED_SPACE}
          className="max-w-sm"
          visual={<CircularProgress value={80} />}
          title={t('usedSpace.title')}
          description={t('usedSpace.description')}
          dismissLabel={t('usedSpace.dismiss')}
          primaryAction={{
            label: t('usedSpace.primary'),
            onClick: () => undefined,
          }}
        />
        <PromoCard
          storageKey={KEY_WORKSHOP}
          className="max-w-sm"
          visual={<PeopleGroup />}
          title={t('workshop.title')}
          titleAccessory={<LiveBadge label={t('workshop.live')} />}
          description={t('workshop.description')}
          dismissLabel={t('workshop.dismiss')}
          primaryAction={{
            label: t('workshop.primary'),
            onClick: () => undefined,
          }}
        />
      </div>
      <div>
        <Button variant="outline" onClick={showBoth}>
          {t('playground.showAgain')}
        </Button>
      </div>
    </div>
  );
}

function SizesShowcase() {
  const t = useTranslations('promo-card-demo');
  const sizes: Array<{ size: PromoCardSize; visualSize: number }> = [
    { size: 'sm', visualSize: 56 },
    { size: 'default', visualSize: 80 },
    { size: 'lg', visualSize: 96 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 items-start gap-6 md:grid-cols-3"
    >
      {sizes.map(({ size, visualSize }) => (
        <div key={size} className="flex flex-col gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {t(`sizes.${size}`)}
            <span className="ml-1.5 normal-case tracking-normal text-muted-foreground/70">
              size=&quot;{size}&quot;
            </span>
          </span>
          <PromoCard
            size={size}
            showCloseIcon
            visual={
              <CircularProgress
                value={80}
                size={visualSize}
                strokeWidth={size === 'sm' ? 7 : size === 'lg' ? 12 : 10}
              />
            }
            title={t('usedSpace.title')}
            description={t('usedSpace.description')}
            dismissLabel={t('usedSpace.dismiss')}
            primaryAction={{
              label: t('usedSpace.primary'),
              onClick: () => undefined,
            }}
          />
          <PromoCard
            size={size}
            showCloseIcon
            visual={<PeopleGroup size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'} />}
            title={t('workshop.title')}
            titleAccessory={<LiveBadge label={t('workshop.live')} />}
            description={t('workshop.description')}
            dismissLabel={t('workshop.dismiss')}
            primaryAction={{
              label: t('workshop.primary'),
              onClick: () => undefined,
            }}
          />
        </div>
      ))}
    </motion.div>
  );
}

function PlaygroundSection() {
  const t = useTranslations('promo-card-demo');
  const [remember, setRemember] = React.useState(false);
  const [, force] = React.useReducer((x: number) => x + 1, 0);

  const activeKey = remember ? KEY_PLAYGROUND : undefined;

  function reset() {
    resetPromoCardDismissal(KEY_PLAYGROUND);
    force();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_auto] md:p-7"
    >
      <PromoCard
        // Force a remount when the key changes so the toggle clearly shows
        // "in-memory vs persisted" behaviour: switching modes resets the card.
        key={activeKey ?? 'in-memory'}
        storageKey={activeKey}
        className="max-w-sm"
        visual={<CircularProgress value={80} />}
        title={t('usedSpace.title')}
        description={t('usedSpace.description')}
        dismissLabel={t('usedSpace.dismiss')}
        primaryAction={{
          label: t('usedSpace.primary'),
          onClick: () => undefined,
        }}
      />

      <div className="flex flex-col gap-4 md:w-72">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {t('playground.rememberLabel')}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('playground.rememberDescription')}
              </span>
            </div>
            <Switch
              checked={remember}
              onCheckedChange={setRemember}
              aria-label={t('playground.rememberLabel')}
            />
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {t('playground.storageKeyLabel')}
            </span>
            <code className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">
              {remember ? `learnic.promo-card.${KEY_PLAYGROUND}` : '—'}
            </code>
          </div>
        </div>

        <Button variant="outline" onClick={reset} disabled={!remember}>
          {t('playground.showAgain')}
        </Button>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function PromoCardDemoView() {
  const t = useTranslations('promo-card-demo');

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          PromoCard
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Showcase"
          title={t('examples.title')}
          description={t('examples.description')}
        />
        <ExamplesShowcase />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Sizes"
          title={t('sizes.title')}
          description={t('sizes.description')}
        />
        <SizesShowcase />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Live"
          title={t('playground.title')}
          description={t('playground.description')}
        />
        <PlaygroundSection />
      </section>
    </main>
  );
}
