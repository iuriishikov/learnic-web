'use client';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { LearnHeader } from './learn-header';
import { LearnPageContent } from './learn-page-content';
import { StudioHeader } from './studio-header';
import { StudioSubHeader } from './studio-sub-header';
import { TeachPageContent } from './teach-page-content';

type Mode = 'learn' | 'teach';

export function StudioModeMockup() {
  const [mode, setMode] = useState<Mode>('learn');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoBar mode={mode} onChange={setMode} />
      <LazyMotion features={domAnimation} strict>
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'learn' ? (
            <m.div
              key="learn"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-1 flex-col"
            >
              <LearnHeader onSwitchToTeach={() => setMode('teach')} />
              <LearnPageContent />
            </m.div>
          ) : (
            <m.div
              key="teach"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-1 flex-col"
            >
              <StudioHeader onSwitchToLearn={() => setMode('learn')} />
              <StudioSubHeader />
              <TeachPageContent />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}

type DemoBarProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

function DemoBar({ mode, onChange }: DemoBarProps) {
  const t = useTranslations('test-studio-mode.demo');

  return (
    <div className="border-b border-dashed border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t('modeLabel')}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {t('modeBadge')}
          </span>
        </div>
        <div
          role="tablist"
          aria-label={t('controlsTitle')}
          className="inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-background p-1"
        >
          <ModeTab
            active={mode === 'learn'}
            onClick={() => onChange('learn')}
            label={t('modeLearn')}
          />
          <ModeTab
            active={mode === 'teach'}
            onClick={() => onChange('teach')}
            label={t('modeTeach')}
          />
        </div>
      </div>
    </div>
  );
}

type ModeTabProps = {
  active: boolean;
  onClick: () => void;
  label: string;
};

function ModeTab({ active, onClick, label }: ModeTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-brand text-brand-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
