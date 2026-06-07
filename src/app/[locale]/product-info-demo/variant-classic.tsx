'use client';

import { ArrowLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';

import {
  DemoAuthorRow,
  DemoDescription,
  DemoFaq,
} from './demo-blocks';
import {
  DEMO_PRODUCT,
  DemoChip,
  DemoCover,
  DemoCurriculum,
  DemoTags,
} from './demo-data';

/**
 * Variant A — «Классика». The familiar marketplace layout, refined: a banner
 * cover, the title block below it, and a two-column body — clean cards for the
 * content + a sticky enroll rail with the facts and tags. The least radical
 * option, closest to today's page.
 */
export function VariantClassic() {
  return (
    <div className="mx-auto w-full max-w-[1140px] px-4 pb-16 pt-12 md:px-6">
      <div className="mb-5">
        <span
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 gap-1.5 text-muted-foreground',
          )}
        >
          <ArrowLeftIcon className="size-4" />В каталог
        </span>
      </div>

      <DemoCover className="aspect-[2.5/1] w-full rounded-2xl border border-border" />

      <div className="mt-6 flex flex-col gap-3">
        <DemoChip>{DEMO_PRODUCT.typeLabel}</DemoChip>
        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl lg:text-[2.5rem]">
          {DEMO_PRODUCT.title}
        </h1>
        <DemoAuthorRow />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_336px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="О конспекте">
            <DemoDescription />
          </Card>
          <Card title="Программа конспекта">
            <DemoCurriculum />
          </Card>
          <Card title="Вопросы и ответы">
            <DemoFaq />
          </Card>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <Button
              type="button"
              size="lg"
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              Записаться
            </Button>
            <dl className="divide-y divide-border">
              <Fact label="Формат" value={DEMO_PRODUCT.typeLabel} />
              <Fact label="Длительность" value={`${DEMO_PRODUCT.durationHours} ч`} />
              <Fact label="Обновлён" value={DEMO_PRODUCT.updatedAtLabel} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Темы
            </h3>
            <DemoTags />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
