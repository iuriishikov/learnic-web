'use client';

import { ArrowLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type Mode = 'current' | 'styled';
type Length = 'short' | 'long';

const SCROLLBAR_CLASS = 'scrollbar-styled';

export function ScrollbarDemoClient() {
  const t = useTranslations('scrollbar-demo');
  const [mode, setMode] = useState<Mode>('current');
  const [length, setLength] = useState<Length>('short');

  useEffect(() => {
    const html = document.documentElement;
    if (mode === 'styled') html.classList.add(SCROLLBAR_CLASS);
    else html.classList.remove(SCROLLBAR_CLASS);
    return () => html.classList.remove(SCROLLBAR_CLASS);
  }, [mode]);

  return (
    <div className="relative min-h-screen bg-background">
      <ViewportEdgeMarker label={t('indicator.viewport')} />

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon-sm"
              variant="ghost"
              render={<Link href="/" aria-label={t('back')} />}
              nativeButton={false}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-heading text-base font-semibold tracking-tight">
                {t('title')}
              </h1>
              <p className="text-xs leading-snug text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Toggle
              label={t('mode.label')}
              value={mode}
              options={[
                { value: 'current', label: t('mode.current') },
                { value: 'styled', label: t('mode.styled') },
              ]}
              onChange={setMode}
            />
            <Toggle
              label={t('length.label')}
              value={length}
              options={[
                { value: 'short', label: t('length.short') },
                { value: 'long', label: t('length.long') },
              ]}
              onChange={setLength}
            />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <BodyEdgeMarker label={t('indicator.body')} />

        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2">
            <ModeBadge mode={mode} />
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {t(mode === 'current' ? 'card.currentTitle' : 'card.styledTitle')}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t(`explainer.${mode}.body`)}
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {t(length === 'short' ? 'card.shortHint' : 'card.longHint')}
          </div>
        </section>

        {length === 'long' ? (
          <ul className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {t('item.title', { index: i + 1 })}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t('item.body')}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: Mode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide ring-1',
        mode === 'current'
          ? 'bg-muted text-muted-foreground ring-border'
          : 'bg-brand/10 text-brand ring-brand/30',
      )}
    >
      {mode}
    </span>
  );
}

/**
 * Sticky vertical ribbon pinned to the right of body's content area. Marks the
 * right edge of the document body so the gap to the viewport edge is visible.
 */
function BodyEdgeMarker({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 right-0 hidden md:block"
    >
      <div className="sticky top-24 -mr-px flex h-32 flex-col items-center justify-center gap-1 rounded-l-md bg-brand px-1 text-[9px] font-semibold uppercase tracking-widest text-brand-foreground">
        <span className="rotate-180 [writing-mode:vertical-rl]">{label}</span>
      </div>
    </div>
  );
}

/**
 * Fixed-position ribbon pinned to the actual viewport's right edge. With
 * `scrollbar-gutter: stable` (current mode) this sits past body's right edge,
 * exposing the gutter visually. With overflow-y: scroll on overlay scrollbar
 * systems it lines up with body's edge — no gap.
 */
function ViewportEdgeMarker({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-1/2 right-0 z-40 hidden -translate-y-1/2 md:block"
    >
      <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-l-md bg-foreground px-1 text-[9px] font-semibold uppercase tracking-widest text-background">
        <span className="rotate-180 [writing-mode:vertical-rl]">{label}</span>
      </div>
    </div>
  );
}
