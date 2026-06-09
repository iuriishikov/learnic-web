import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type InfoSectionProps = {
  /** Small uppercase section label rendered above the content. */
  eyebrow: string;
  /** First section after the hero — no top hairline, tighter spacing. */
  first?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Container-less editorial section for the public product landing («Спотлайт»
 * layout): an uppercase eyebrow over the content, separated from the previous
 * section by a hairline rule. Replaces the old `InfoCard` chrome — the landing
 * reads as one column of prose, not a stack of cards.
 */
export function InfoSection({
  eyebrow,
  first,
  className,
  children,
}: InfoSectionProps) {
  return (
    <section
      className={cn(
        // Non-first sections carry the divider with symmetric space on BOTH
        // sides (mt + pt) so a framed list above (curriculum / FAQ border-y)
        // never abuts the rule and reads as a doubled / broken line.
        first
          ? 'pt-10 md:pt-14'
          : 'mt-10 border-t border-border pt-10 md:mt-14 md:pt-14',
        className,
      )}
    >
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:mb-6">
        {eyebrow}
      </p>
      {children}
    </section>
  );
}
