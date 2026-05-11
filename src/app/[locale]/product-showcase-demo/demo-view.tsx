'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import {
  ProductShowcaseCard,
  type ProductShowcaseAccent,
  type ProductShowcaseType,
} from '@/features/products';
import { cn } from '@/shared/lib/utils';
import { CodeBlock } from '@/shared/ui/code-block';

const ACCENTS: ProductShowcaseAccent[] = [
  'pink',
  'green',
  'amber',
  'sky',
  'violet',
  'lilac',
];

const TYPES: ProductShowcaseType[] = ['course', 'webinar', 'podcast'];

const USAGE_SNIPPET = `import { ProductShowcaseCard } from '@/features/products';

<ProductShowcaseCard
  type="course"
  typeLabel="Course"
  accent="pink"
  title="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  durationLabel="2.2 hours"
  dueLabel="Due Tomorrow"
  onClick={() => router.push(\`/products/\${id}\`)}
/>`;

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

function LiveSection() {
  const t = useTranslations('product-showcase-demo');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-muted/40 p-5 sm:grid-cols-2 md:p-7 lg:grid-cols-3"
    >
      <ProductShowcaseCard
        type="course"
        typeLabel={t('demo.type.course')}
        title={t('demo.courseTitle')}
        durationLabel={t('demo.courseDuration')}
        dueLabel={t('demo.dueTomorrow')}
        accent="pink"
        onClick={() => {}}
      />
      <ProductShowcaseCard
        type="podcast"
        typeLabel={t('demo.type.podcast')}
        title={t('demo.webinarTitle')}
        durationLabel={t('demo.webinarDuration')}
        accent="green"
        onClick={() => {}}
      />
      <ProductShowcaseCard
        type="webinar"
        typeLabel={t('demo.type.webinar')}
        title={t('demo.physicsTitle')}
        durationLabel={t('demo.lectureDuration')}
        dueLabel={t('demo.dueFriday')}
        accent="amber"
        onClick={() => {}}
      />
    </motion.div>
  );
}

function AccentsSection() {
  const t = useTranslations('product-showcase-demo');
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ACCENTS.map((accent, i) => (
        <motion.div
          key={accent}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          className="flex flex-col gap-2"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            accent=&quot;{accent}&quot;
          </span>
          <ProductShowcaseCard
            type="course"
            typeLabel={t('demo.type.course')}
            title={t('demo.designSystemTitle')}
            durationLabel={t('demo.courseDuration')}
            dueLabel={t('demo.dueNextWeek')}
            accent={accent}
          />
        </motion.div>
      ))}
    </div>
  );
}

function TypesSection() {
  const t = useTranslations('product-showcase-demo');
  const typeAccents: Record<ProductShowcaseType, ProductShowcaseAccent> = {
    course: 'pink',
    webinar: 'amber',
    podcast: 'green',
  };
  const titleFor: Record<ProductShowcaseType, string> = {
    course: t('demo.dataTitle'),
    webinar: t('demo.physicsTitle'),
    podcast: t('demo.writingTitle'),
  };
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {TYPES.map((type, i) => (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="flex flex-col gap-2"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            type=&quot;{type}&quot;
          </span>
          <ProductShowcaseCard
            type={type}
            typeLabel={t(`demo.type.${type}`)}
            title={titleFor[type]}
            durationLabel={t('demo.courseDuration')}
            dueLabel={type === 'podcast' ? null : t('demo.dueTomorrow')}
            accent={typeAccents[type]}
          />
        </motion.div>
      ))}
    </div>
  );
}

function AnatomyPin({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 24,
        delay: 0.15 + index * 0.07,
      }}
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-10 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background shadow-md ring-2 ring-background',
        className,
      )}
    >
      {index}
    </motion.span>
  );
}

function AnatomySection() {
  const t = useTranslations('product-showcase-demo');

  const items = [
    {
      index: 1,
      label: t('anatomy.cover.label'),
      description: t('anatomy.cover.description'),
    },
    {
      index: 2,
      label: t('anatomy.pill.label'),
      description: t('anatomy.pill.description'),
    },
    {
      index: 3,
      label: t('anatomy.title.label'),
      description: t('anatomy.title.description'),
    },
    {
      index: 4,
      label: t('anatomy.stats.label'),
      description: t('anatomy.stats.description'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-7">
      <div className="relative mx-auto w-full max-w-sm">
        <AnatomyPin index={1} className="-left-3 top-4" />
        <AnatomyPin index={2} className="-left-3 top-[8rem]" />
        <AnatomyPin index={3} className="-right-3 top-[12.5rem]" />
        <AnatomyPin index={4} className="-right-3 top-[16.5rem]" />
        <ProductShowcaseCard
          type="course"
          typeLabel={t('demo.type.course')}
          title={t('demo.courseTitle')}
          durationLabel={t('demo.courseDuration')}
          dueLabel={t('demo.dueTomorrow')}
          accent="pink"
        />
      </div>

      <ol className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.index}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {item.index}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.description}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function UsageSection() {
  const t = useTranslations('product-showcase-demo');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-7">
        {t('usage.snippetLabel')}
      </div>
      <div className="p-5 md:p-7">
        <CodeBlock code={USAGE_SNIPPET} language="tsx" showLineNumbers />
      </div>
    </motion.div>
  );
}

export function ProductShowcaseDemoView() {
  const t = useTranslations('product-showcase-demo');

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
          eyebrow={t('sections.live.eyebrow')}
          title={t('sections.live.title')}
          description={t('sections.live.description')}
        />
        <LiveSection />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={t('sections.accents.eyebrow')}
          title={t('sections.accents.title')}
          description={t('sections.accents.description')}
        />
        <AccentsSection />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={t('sections.types.eyebrow')}
          title={t('sections.types.title')}
          description={t('sections.types.description')}
        />
        <TypesSection />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={t('sections.anatomy.eyebrow')}
          title={t('sections.anatomy.title')}
          description={t('sections.anatomy.description')}
        />
        <AnatomySection />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={t('sections.usage.eyebrow')}
          title={t('sections.usage.title')}
          description={t('sections.usage.description')}
        />
        <UsageSection />
      </section>
    </main>
  );
}
