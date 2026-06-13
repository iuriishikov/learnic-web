'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  OutlineNav,
  type OutlineNavItem,
} from '@/shared/ui/outline-nav';

/* ---------- Example 1 data: in-page document with scroll-spy ---------- */

type DemoSection = {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
};

const DOC_SECTIONS: DemoSection[] = [
  { id: 'overview', title: '1. Обзор' },
  {
    id: 'getting-started',
    title: '2. Начало работы',
    subsections: [
      { id: 'install', title: '2.1. Установка' },
      { id: 'configuration', title: '2.2. Настройка' },
    ],
  },
  {
    id: 'concepts',
    title: '3. Основные понятия',
    subsections: [
      { id: 'items', title: '3.1. Элементы и вложенность' },
      { id: 'active', title: '3.2. Активный элемент' },
      { id: 'scroll-spy', title: '3.3. Scroll-spy' },
    ],
  },
  { id: 'styling', title: '4. Оформление' },
  { id: 'accessibility', title: '5. Доступность' },
];

const DOC_NAV: OutlineNavItem[] = DOC_SECTIONS.map((section) => ({
  id: section.id,
  label: section.title,
  children: section.subsections?.map((sub) => ({
    id: sub.id,
    label: sub.title,
  })),
}));

const FILLER =
  'Это демонстрационный текст раздела. Прокручивайте страницу — активный пункт в навигации слева подсветится автоматически по мере появления заголовков на экране. Клик по пункту плавно прокрутит к соответствующему разделу.';

/* ---------- Example 2 data: collapsible modules → lessons ---------- */

const COURSE_NAV: OutlineNavItem[] = [
  {
    id: 'm1',
    label: 'Модуль 1. Основы',
    children: [
      { id: 'm1l1', label: 'Урок 1. Знакомство' },
      { id: 'm1l2', label: 'Урок 2. Установка окружения' },
      { id: 'm1l3', label: 'Урок 3. Первый проект' },
    ],
  },
  {
    id: 'm2',
    label: 'Модуль 2. Компоненты',
    children: [
      { id: 'm2l1', label: 'Урок 4. Разметка' },
      {
        id: 'm2l2',
        label: 'Урок 5. Стили',
        children: [
          { id: 'm2l2a', label: 'Токены' },
          { id: 'm2l2b', label: 'Тёмная тема' },
        ],
      },
      { id: 'm2l3', label: 'Урок 6. Состояние', disabled: true },
    ],
  },
  {
    id: 'm3',
    label: 'Модуль 3. Продвинутое',
    children: [
      { id: 'm3l1', label: 'Урок 7. Производительность' },
      { id: 'm3l2', label: 'Урок 8. Тестирование' },
    ],
  },
];

export function OutlineNavDemoView() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          OutlineNav
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Иерархическая навигация-оглавление с вложенными пунктами, активной
          подсветкой и двумя режимами: scroll-spy для страницы и
          управляемое сворачиваемое дерево для уроков и модулей.
        </p>
      </header>

      <ScrollSpyExample />
      <CourseTreeExample />
    </div>
  );
}

function ScrollSpyExample() {
  return (
    <section className="mb-16">
      <DemoHeading
        title="Режим scroll-spy"
        description="scrollSpy + вложенные подпункты. Активный пункт следует за прокруткой; клик — плавный переход к заголовку."
      />

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <OutlineNav
              items={DOC_NAV}
              ariaLabel="Оглавление демонстрации"
              scrollSpy
              scrollSpyRootMargin="-24px 0px -66% 0px"
            />
          </div>
        </aside>

        <div className="min-w-0">
          {DOC_SECTIONS.map((section) => (
            <div key={section.id}>
              <h2
                id={section.id}
                className="scroll-mt-6 pt-6 text-xl font-semibold text-foreground first:pt-0"
              >
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{FILLER}</p>
              <p className="mt-3 leading-7 text-muted-foreground">{FILLER}</p>

              {section.subsections?.map((sub) => (
                <div key={sub.id}>
                  <h3
                    id={sub.id}
                    className="scroll-mt-6 pt-6 text-lg font-semibold text-foreground"
                  >
                    {sub.title}
                  </h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {FILLER}
                  </p>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {FILLER}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CourseTreeExample() {
  const [selected, setSelected] = useState<{ id: string; label: string }>({
    id: 'm1l1',
    label: 'Урок 1. Знакомство',
  });

  return (
    <section>
      <DemoHeading
        title="Управляемое дерево: модули → уроки"
        description="collapsible + activeId. Клик по модулю — свернуть/развернуть; по уроку — выбрать (активная ветка раскрывается сама). Третий уровень и заблокированный пункт — для примера."
      />

      <div className="grid gap-6 sm:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card p-4">
          <OutlineNav
            items={COURSE_NAV}
            ariaLabel="Программа курса"
            collapsible
            activeId={selected.id}
            onSelect={(id, item) =>
              setSelected({ id, label: String(item.label) })
            }
          />
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-6">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            onSelect
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {selected.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            id: <code className="rounded bg-muted px-1 py-0.5">{selected.id}</code>
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            В реальном конспекте этот обработчик загрузил бы выбранный урок
            (или сменил маршрут), а <code>activeId</code> приходил бы из
            текущего урока.
          </p>
        </div>
      </div>
    </section>
  );
}

function DemoHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={cn('mb-6 border-b border-border pb-4')}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
