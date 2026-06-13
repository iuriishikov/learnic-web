import { ChevronLeft, ChevronRight, Lock, Plus, Share } from 'lucide-react';
import NextImage from 'next/image';

import { SITE_URL } from '@/shared/config/site';
import { cn } from '@/shared/lib/utils';

type DeviceShowcaseProps = {
  /** Accessible description of the app screenshot shown inside the frames. */
  alt: string;
  /** Anchor id so the hero demo CTA can scroll to this section. */
  id?: string;
  className?: string;
};

const DESKTOP_SHADOW =
  'shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.10),-50px_0_70px_-30px_rgba(0,0,0,0.08),50px_0_70px_-30px_rgba(0,0,0,0.08)]';
const DESKTOP_SHADOW_DARK =
  'dark:shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45),-50px_0_70px_-30px_rgba(0,0,0,0.35),50px_0_70px_-30px_rgba(0,0,0,0.35)]';

const PHONE_SHADOW =
  'shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.10),-35px_0_60px_-25px_rgba(0,0,0,0.08),35px_0_60px_-25px_rgba(0,0,0,0.08)]';
const PHONE_SHADOW_DARK =
  'dark:shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45),-35px_0_60px_-25px_rgba(0,0,0,0.30),35px_0_60px_-25px_rgba(0,0,0,0.30)]';

/**
 * Domain shown in the mock Safari address bar. Derived from the configured site
 * URL so it auto-tracks the real domain in production; falls back to the brand
 * domain when SITE_URL is a localhost dev value.
 */
const DEMO_HOST = (() => {
  try {
    const { host } = new URL(SITE_URL);
    return host.startsWith('localhost') ? 'learnic.ru' : host;
  } catch {
    return 'learnic.ru';
  }
})();

/**
 * Mock macOS Safari toolbar rendered above the desktop screenshot: traffic-light
 * window controls + a centred address pill. Purely decorative chrome around the
 * app screenshot, so the whole bar is hidden from assistive tech. The lights use
 * the destructive / warning / online tokens, so they stay red / amber / green in
 * both themes without any hardcoded hex.
 */
function BrowserChrome() {
  return (
    <div
      aria-hidden
      className="relative flex h-11 items-center gap-3 border-b border-border bg-muted/60 px-4"
    >
      {/* window controls */}
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-destructive" />
        <span className="size-3 rounded-full bg-warning" />
        <span className="size-3 rounded-full bg-online" />
      </div>

      {/* back / forward — collapse on narrow frames, like a real browser */}
      <div className="hidden items-center gap-1 text-muted-foreground/40 md:flex">
        <ChevronLeft className="size-4" />
        <ChevronRight className="size-4" />
      </div>

      {/* centred address pill */}
      <div className="pointer-events-none absolute left-1/2 flex h-7 w-full max-w-[360px] -translate-x-1/2 items-center justify-center gap-1.5 rounded-md bg-background/80 px-3 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
        <Lock className="size-3 shrink-0" />
        <span className="truncate">{DEMO_HOST}</span>
      </div>

      {/* trailing toolbar icons — collapse on narrow frames */}
      <div className="ml-auto hidden items-center gap-3 text-muted-foreground/40 md:flex">
        <Share className="size-4" />
        <Plus className="size-4" />
      </div>
    </div>
  );
}

export function DeviceShowcase({ alt, id, className }: DeviceShowcaseProps) {
  return (
    <div id={id} className={cn('relative w-full', className)}>
      <div className="mx-auto hidden w-full max-w-[1200px] sm:block">
        <DesktopFrame alt={alt} />
      </div>
      <div className="mx-auto block w-full max-w-[420px] sm:hidden">
        <PhoneFrame alt={alt} />
      </div>
    </div>
  );
}

/**
 * Theme-aware app screenshot: light + dark variants are both in the DOM and
 * swapped purely in CSS (`dark:hidden` / `hidden dark:block`) so the correct
 * one paints on first render with no theme-flash. `object-top` keeps the
 * recognisable top of the page (header → lesson title → graph) in frame when
 * the source aspect doesn't match the device screen.
 */
function ThemedShot({
  lightSrc,
  darkSrc,
  alt,
  sizes,
  fit,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  sizes: string;
  /** object-fit / object-position utilities tuned per device aspect. */
  fit: string;
}) {
  return (
    <>
      <NextImage
        src={lightSrc}
        alt={alt}
        fill
        priority
        sizes={sizes}
        className={cn(fit, 'dark:hidden')}
      />
      <NextImage
        src={darkSrc}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        className={cn('hidden dark:block', fit)}
      />
    </>
  );
}

const DESKTOP_SIZES = '(min-width: 1216px) 1200px, 100vw';
const PHONE_SIZES = '420px';

function DesktopFrame({ alt }: { alt: string }) {
  return (
    // outer hairline
    <div
      className={cn(
        'relative rounded-t-[32px] bg-foreground/30 p-px pb-0',
        DESKTOP_SHADOW,
        DESKTOP_SHADOW_DARK,
      )}
    >
      {/* outer body */}
      <div className="relative rounded-t-[31px] bg-background p-[10px] pb-0">
        {/* middle hairline */}
        <div className="relative rounded-t-[21px] bg-foreground/25 p-px pb-0">
          {/* inner body */}
          <div className="relative rounded-t-[20px] bg-background p-[5px] pb-0">
            {/* inner hairline — bezel around screen */}
            <div className="relative rounded-t-[15px] bg-foreground/25 p-px pb-0">
              {/* screen */}
              <div className="relative overflow-hidden rounded-t-[14px] bg-background">
                <BrowserChrome />
                <div className="relative aspect-[4/3] w-full">
                  <ThemedShot
                    lightSrc="/landing/reader-desktop-light.png"
                    darkSrc="/landing/reader-desktop-dark.png"
                    alt={alt}
                    sizes={DESKTOP_SIZES}
                    fit="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ alt }: { alt: string }) {
  return (
    // outer hairline
    <div
      className={cn(
        'relative rounded-t-[52px] bg-foreground/30 p-px pb-0',
        PHONE_SHADOW,
        PHONE_SHADOW_DARK,
      )}
    >
      {/* outer body */}
      <div className="relative rounded-t-[51px] bg-background p-[8px] pb-0">
        {/* middle hairline */}
        <div className="relative rounded-t-[44px] bg-foreground/25 p-px pb-0">
          {/* inner body */}
          <div className="relative rounded-t-[43px] bg-background p-[4px] pb-0">
            {/* inner hairline — bezel around screen */}
            <div className="relative rounded-t-[39px] bg-foreground/25 p-px pb-0">
              {/* screen */}
              <div className="relative overflow-hidden rounded-t-[38px] bg-background">
                <div className="relative aspect-[9/16] w-full">
                  <ThemedShot
                    lightSrc="/landing/reader-mobile-light.png"
                    darkSrc="/landing/reader-mobile-dark.png"
                    alt={alt}
                    sizes={PHONE_SIZES}
                    fit="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
