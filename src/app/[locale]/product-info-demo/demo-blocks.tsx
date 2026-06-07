'use client';

import { ClockIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { UserAvatar } from '@/shared/ui/user-avatar';

import {
  DEMO_FAQ,
  DEMO_PRODUCT,
  DemoCurriculum,
  DemoTags,
} from './demo-data';

/** Author + duration line. `onDark` flips text colours for cover overlays. */
export function DemoAuthorRow({ onDark = false }: { onDark?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 text-sm',
        onDark ? 'text-white/85' : 'text-muted-foreground',
      )}
    >
      <span className="inline-flex items-center gap-2">
        <UserAvatar
          user={{
            id: 'demo-author',
            fullName: DEMO_PRODUCT.author.fullName,
            avatar: null,
            isVerified: DEMO_PRODUCT.author.isVerified,
          }}
          size="sm"
          statusType={DEMO_PRODUCT.author.isVerified ? 'verified' : null}
        />
        <span className={cn('font-medium', onDark ? 'text-white' : 'text-foreground')}>
          {DEMO_PRODUCT.author.fullName}
        </span>
      </span>
      <span
        aria-hidden
        className={cn('size-1 rounded-full', onDark ? 'bg-white/40' : 'bg-muted-foreground/40')}
      />
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon className="size-3.5" aria-hidden />
        {DEMO_PRODUCT.durationHours} ч
      </span>
    </div>
  );
}

export function DemoDescription() {
  return (
    <div
      className="text-base leading-[1.75] text-foreground md:text-[1.0625rem] [&_li]:my-1 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: DEMO_PRODUCT.descriptionHtml }}
    />
  );
}

export function DemoFaq() {
  return (
    <Accordion className="gap-0 border-y border-border">
      {DEMO_FAQ.map((entry) => (
        <AccordionItem key={entry.id} value={entry.id}>
          <AccordionTrigger className="py-4 text-base font-medium text-foreground hover:no-underline">
            {entry.q}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-base leading-relaxed text-muted-foreground">
              {entry.a}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** A container-less editorial section: top hairline (except first) + eyebrow. */
export function DemoSection({
  eyebrow,
  first,
  children,
}: {
  eyebrow: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        // Non-first sections carry the divider with symmetric space on BOTH
        // sides (mt + pt) so a framed list above (curriculum / FAQ border-y)
        // never abuts the rule and reads as a doubled / broken line.
        first
          ? 'pt-10 md:pt-14'
          : 'mt-10 border-t border-border pt-10 md:mt-14 md:pt-14',
      )}
    >
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:mb-6">
        {eyebrow}
      </p>
      {children}
    </section>
  );
}

/** The shared single-column editorial body used by the magazine + spotlight variants. */
export function DemoEditorialSections() {
  return (
    <>
      <DemoSection first eyebrow="О конспекте">
        <DemoDescription />
      </DemoSection>
      <DemoSection eyebrow="Программа">
        <DemoCurriculum />
      </DemoSection>
      <DemoSection eyebrow="Темы">
        <DemoTags />
      </DemoSection>
      <DemoSection eyebrow="Вопросы">
        <DemoFaq />
      </DemoSection>
      <DemoSection eyebrow="Информация">
        <DemoMetaFacts />
      </DemoSection>
    </>
  );
}

/** Inline `label · value` facts for the editorial colophon. */
export function DemoMetaFacts({ className }: { className?: string }) {
  const facts = [
    { label: 'Формат', value: DEMO_PRODUCT.typeLabel },
    { label: 'Длительность', value: `${DEMO_PRODUCT.durationHours} ч` },
    { label: 'Обновлён', value: DEMO_PRODUCT.updatedAtLabel },
  ];
  return (
    <dl className={cn('flex flex-wrap gap-x-8 gap-y-3 text-sm', className)}>
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-center gap-1.5">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
          <dd className="font-medium text-foreground">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
