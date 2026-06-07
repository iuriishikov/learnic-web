'use client';

import {
  ChevronRightIcon,
  FileTextIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

/* -------------------------------------------------------------------------- */
/* Mock data — self-contained so the demo renders with no backend.            */
/* -------------------------------------------------------------------------- */

export const DEMO_PRODUCT = {
  title: 'Машинное обучение на Python: от основ до продакшена',
  lead: 'От подготовки данных до вывода модели в продакшен — системно и на реальных задачах.',
  typeLabel: 'Конспект',
  author: { fullName: 'Шиков Юрий Владимирович', isVerified: true },
  durationHours: 24,
  updatedAtLabel: '4 июня 2026',
  tags: [
    { id: 't1', name: 'Python', color: '#3776ab' },
    { id: 't2', name: 'Machine Learning', color: '#ef6c00' },
    { id: 't3', name: 'Data Science', color: '#6c5ce7' },
  ],
  descriptionHtml: `
    <p>Практический конспект по машинному обучению: от подготовки данных и
    классических моделей до нейросетей и вывода модели в продакшен. Каждый
    раздел — это сжатая выжимка теории и разборы на реальных задачах, без воды.</p>
    <p>Подойдёт тем, кто уже пишет на Python и хочет системно разобраться в ML:
    аналитикам, бэкенд-разработчикам и студентам технических специальностей.</p>
    <ul>
      <li>Векторизация и работа с данными в NumPy и pandas</li>
      <li>Линейные модели, деревья и ансамбли с нуля</li>
      <li>Нейросети на PyTorch и борьба с переобучением</li>
    </ul>
  `,
};

export type DemoModule = {
  id: string;
  title: string;
  lessons: { id: string; title: string; materials: number }[];
};

export const DEMO_MODULES: DemoModule[] = [
  {
    id: 'm1',
    title: 'Введение и инструменты',
    lessons: [
      { id: 'l1', title: 'Установка окружения и Jupyter', materials: 4 },
      { id: 'l2', title: 'NumPy: массивы и векторизация', materials: 6 },
      { id: 'l3', title: 'matplotlib: визуализация данных', materials: 5 },
    ],
  },
  {
    id: 'm2',
    title: 'Классические модели',
    lessons: [
      { id: 'l4', title: 'Линейная и логистическая регрессия', materials: 7 },
      { id: 'l5', title: 'Деревья решений и ансамбли', materials: 8 },
    ],
  },
  {
    id: 'm3',
    title: 'Глубокое обучение',
    lessons: [
      { id: 'l6', title: 'Нейросети на PyTorch', materials: 9 },
      { id: 'l7', title: 'Обучение, регуляризация и метрики', materials: 6 },
    ],
  },
];

export const DEMO_FAQ = [
  {
    id: 'f1',
    q: 'Нужен ли опыт в программировании?',
    a: 'Желательно базовое знание Python — синтаксис, функции, списки. Всю математику и библиотеки разбираем по ходу конспекта.',
  },
  {
    id: 'f2',
    q: 'Будут ли практические примеры?',
    a: 'Да. Почти каждый урок построен вокруг разбора реальной задачи с кодом, который можно повторить у себя.',
  },
  {
    id: 'f3',
    q: 'Как часто обновляется материал?',
    a: 'Конспект поддерживается автором: примеры и версии библиотек обновляются по мере выхода значимых изменений.',
  },
];

/* -------------------------------------------------------------------------- */
/* Curriculum — the numbered "table of contents" the user liked. Shared       */
/* across every variant unchanged.                                            */
/* -------------------------------------------------------------------------- */

export function DemoCurriculum() {
  const totalLessons = DEMO_MODULES.reduce((s, m) => s + m.lessons.length, 0);
  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        {DEMO_MODULES.length} модуля · {totalLessons} уроков
      </p>
      <ul className="divide-y divide-border border-y border-border">
        {DEMO_MODULES.map((module, index) => (
          <DemoModuleRow key={module.id} module={module} index={index} />
        ))}
      </ul>
    </div>
  );
}

function DemoModuleRow({
  module,
  index,
}: {
  module: DemoModule;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(index === 0);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group/module flex w-full items-center gap-4 py-4 text-left"
      >
        <span className="w-10 shrink-0 text-2xl font-semibold tabular-nums text-muted-foreground/50 md:text-3xl">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1 text-base font-medium text-foreground transition-colors group-hover/module:text-brand md:text-lg">
          {module.title}
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          {module.lessons.length} уроков
        </span>
        <ChevronRightIcon
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="lessons"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }
            }
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            <ul className="mb-3 ml-[1.4rem] flex flex-col border-l border-border pl-6">
              {module.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center gap-2.5 py-2.5 text-sm"
                >
                  <FileTextIcon
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {lesson.title}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    {lesson.materials} материалов
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Small shared bits.                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Brand-gradient mesh stand-in for the cover image (real covers are photos).
 * `overlay` adds an ink scrim for white text laid over the cover; `blend`
 * dissolves the bottom edge into the page surface (used by the full-screen
 * spotlight cover).
 */
export function DemoCover({
  className,
  children,
  overlay = false,
  blend = false,
}: {
  className?: string;
  children?: ReactNode;
  overlay?: boolean;
  blend?: boolean;
}) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      {/* Mesh: base diagonal + a few soft brand blobs for depth. */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400" />
      <div className="absolute -left-[15%] -top-[30%] size-[70%] rounded-full bg-brand-300/45 blur-3xl" />
      <div className="absolute -right-[12%] top-[5%] size-[55%] rounded-full bg-brand-400/40 blur-3xl" />
      <div className="absolute -bottom-[35%] left-[18%] size-[80%] rounded-full bg-brand-900/55 blur-3xl" />
      {/* Soft light from the top edge. */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
      {/* Legibility ink scrim for overlaid text. */}
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      ) : null}
      {/* Dissolve the bottom edge into the page surface (full-screen cover). */}
      {blend ? (
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      ) : null}
      {children}
    </div>
  );
}

export function DemoChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-foreground/80 ring-1 ring-foreground/10',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DemoTags({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {DEMO_PRODUCT.tags.map((tag) => (
        <li
          key={tag.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-1 text-xs text-foreground"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </li>
      ))}
    </ul>
  );
}
