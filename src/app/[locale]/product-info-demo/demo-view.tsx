'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { VariantClassic } from './variant-classic';
import { VariantEditorial } from './variant-editorial';
import { VariantSpotlight } from './variant-spotlight';

const VARIANTS = [
  { id: 'classic', label: 'Классика' },
  { id: 'editorial', label: 'Журнал' },
  { id: 'spotlight', label: 'Спотлайт' },
] as const;

type VariantId = (typeof VARIANTS)[number]['id'];

/**
 * Internal preview page: flip between proposed designs for the product info
 * page (all keeping the numbered-curriculum block) and toggle the theme. The
 * switcher is a floating pill so it sits cleanly over the full-screen spotlight
 * cover. Not a production route — mock data, no backend.
 */
export function ProductInfoDemoView() {
  const [active, setActive] = useState<VariantId>('classic');

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur dark:shadow-black/40">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active === v.id
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v.label}
            </button>
          ))}
          <div aria-hidden className="mx-1 h-5 w-px bg-border" />
          <ThemeButton />
        </div>
      </div>

      {active === 'classic' ? (
        <VariantClassic />
      ) : active === 'editorial' ? (
        <VariantEditorial />
      ) : (
        <VariantSpotlight />
      )}
    </div>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Переключить тему"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <SunIcon className="hidden size-4 dark:block" />
      <MoonIcon className="size-4 dark:hidden" />
    </button>
  );
}
