'use client';

import { ArrowLeftIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { CodeBlock } from '@/shared/ui/code-block';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const INSTALL_TABS = [
  { label: 'npm', code: 'npm install @learnic/ui' },
  { label: 'yarn', code: 'yarn add @learnic/ui' },
  { label: 'bun', code: 'bun add @learnic/ui' },
];

const COLORS_SNIPPET = `export const colors = {
  current: "currentColor",
  transparent: "transparent",
  white: "rgb(var(--colors-white) / <alpha-value>)",
  black: "rgb(var(--colors-black) / <alpha-value>)",

  // These will be inverted in dark mode.
  "alpha-white": "rgb(var(--colors-alpha-white) / <alpha-value>)",
  "alpha-black": "rgb(var(--colors-alpha-black) / <alpha-value>)",
  brand: {
    25: "rgb(var(--colors-brand-25) / <alpha-value>)",
    50: "rgb(var(--colors-brand-50) / <alpha-value>)",
    100: "rgb(var(--colors-brand-100) / <alpha-value>)",
    200: "rgb(var(--colors-brand-200) / <alpha-value>)",
    300: "rgb(var(--colors-brand-300) / <alpha-value>)",
    400: "rgb(var(--colors-brand-400) / <alpha-value>)",
    500: "rgb(var(--colors-brand-500) / <alpha-value>)",
    600: "rgb(var(--colors-brand-600) / <alpha-value>)",
    700: "rgb(var(--colors-brand-700) / <alpha-value>)",
    800: "rgb(var(--colors-brand-800) / <alpha-value>)",
    900: "rgb(var(--colors-brand-900) / <alpha-value>)",
  },
}`;

const SHORT_SNIPPET = `// Imports
import mongoose, { Schema } from 'untitled'

// Collection name
export const collection = 'Design'

// Schema
const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true })

// Model
export default mongoose.model(collection, schema, collection)`;

const USAGE_SNIPPET = `import { CodeBlock } from '@/shared/ui/code-block';

// With language tabs (npm / yarn / bun)
<CodeBlock
  tabs={[
    { label: 'npm',  code: 'npm install @learnic/ui' },
    { label: 'yarn', code: 'yarn add @learnic/ui' },
    { label: 'bun',  code: 'bun add @learnic/ui' },
  ]}
  language="bash"
/>

// Single snippet — same shell, no tabs
<CodeBlock code={source} language="ts" />

// With line numbers and a "Show more" overlay
<CodeBlock
  code={source}
  language="ts"
  showLineNumbers
  collapsedLineCount={10}
/>`;

type SectionProps = {
  index: number;
  title: string;
  description: string;
  children: React.ReactNode;
};

function Section({ index, title, description, children }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 26,
        delay: index * 0.05,
      }}
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </header>
      {children}
    </motion.section>
  );
}

export function CodeBlockDemoClient() {
  const t = useTranslations('code-block-demo');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('back')}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-[15px]">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-5 md:gap-6">
          <Section
            index={0}
            title={t('cases.tabs.title')}
            description={t('cases.tabs.description')}
          >
            <CodeBlock tabs={INSTALL_TABS} language="bash" />
          </Section>

          <Section
            index={1}
            title={t('cases.collapse.title')}
            description={t('cases.collapse.description')}
          >
            <CodeBlock
              code={COLORS_SNIPPET}
              language="ts"
              collapsedLineCount={10}
            />
          </Section>

          <Section
            index={2}
            title={t('cases.lineNumbers.title')}
            description={t('cases.lineNumbers.description')}
          >
            <CodeBlock
              code={SHORT_SNIPPET}
              language="ts"
              showLineNumbers
              expanded
            />
          </Section>

          <Section
            index={3}
            title={t('cases.usage.title')}
            description={t('cases.usage.description')}
          >
            <CodeBlock code={USAGE_SNIPPET} language="tsx" expanded />
          </Section>
        </div>
      </main>
    </div>
  );
}
