'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  MousePointer2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button } from '@/shared/ui/button';
import {
  CollaborationCursor,
  type CollabUser,
} from '@/shared/ui/collaboration-cursor';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';

// ─────────────────────────────────────────────────────────────────────────────
// People pool

const ALL_USERS: CollabUser[] = [
  { id: 'olivia', name: 'Olivia Reed', color: '#6c5ce7', status: 'Редактирует' },
  { id: 'mateo', name: 'Mateo García', color: '#0ea5e9', status: 'Смотрит' },
  { id: 'aiko', name: 'Aiko Tanaka', color: '#ec4899', status: 'Комментирует' },
  { id: 'lena', name: 'Lena Voss', color: '#10b981', status: 'Смотрит' },
  { id: 'darius', name: 'Darius Khan', color: '#f97316', status: 'Печатает…' },
  { id: 'priya', name: 'Priya Shah', color: '#a855f7', status: 'Смотрит' },
  { id: 'noah', name: 'Noah Schmidt', color: '#14b8a6', status: 'Идлит' },
  { id: 'eva', name: 'Eva Lindqvist', color: '#ef4444', status: 'Смотрит' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section helper

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Single cursor that hops between fields, and lets you add/remove users

type FieldKey =
  | 'title'
  | 'subtitle'
  | 'chart'
  | 'description'
  | 'cta'
  | 'date';

const FIELD_ORDER: readonly FieldKey[] = [
  'title',
  'chart',
  'description',
  'cta',
  'date',
  'subtitle',
];

function SingleCursorPlayground() {

  const titleRef = React.useRef<HTMLInputElement>(null);
  const subtitleRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const ctaRef = React.useRef<HTMLButtonElement>(null);
  const dateRef = React.useRef<HTMLButtonElement>(null);

  const refMap = React.useMemo(
    () =>
      ({
        title: titleRef,
        subtitle: subtitleRef,
        description: descriptionRef,
        chart: chartRef,
        cta: ctaRef,
        date: dateRef,
      }) satisfies Record<FieldKey, React.RefObject<HTMLElement | null>>,
    [],
  );

  const [activeField, setActiveField] = React.useState<FieldKey>('title');
  const [users, setUsers] = React.useState<CollabUser[]>([ALL_USERS[0]!]);
  const [auto, setAuto] = React.useState(false);

  React.useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setActiveField((prev) => {
        const idx = FIELD_ORDER.indexOf(prev);
        return FIELD_ORDER[(idx + 1) % FIELD_ORDER.length]!;
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, [auto]);

  const cursorTarget = refMap[activeField];

  const addUser = () => {
    setUsers((cur) => {
      if (cur.length >= ALL_USERS.length) return cur;
      const remaining = ALL_USERS.filter(
        (u) => !cur.find((c) => c.id === u.id),
      );
      const next = remaining[0];
      if (!next) return cur;
      return [...cur, next];
    });
  };

  const removeUser = () => {
    setUsers((cur) => (cur.length <= 1 ? cur : cur.slice(0, -1)));
  };

  const reset = () => {
    setUsers([ALL_USERS[0]!]);
    setActiveField('title');
    setAuto(false);
  };

  const moveToNext = () => {
    setActiveField((prev) => {
      const idx = FIELD_ORDER.indexOf(prev);
      return FIELD_ORDER[(idx + 1) % FIELD_ORDER.length]!;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <Button onClick={moveToNext} size="sm" variant="outline">
          <MousePointer2Icon className="size-3.5" />
          Передвинуть курсор
        </Button>
        <Button
          onClick={addUser}
          size="sm"
          variant="outline"
          disabled={users.length >= ALL_USERS.length}
        >
          <PlusIcon className="size-3.5" />
          Добавить пользователя
        </Button>
        <Button
          onClick={removeUser}
          size="sm"
          variant="outline"
          disabled={users.length <= 1}
        >
          <Trash2Icon className="size-3.5" />
          Убрать пользователя
        </Button>
        <Button onClick={reset} size="sm" variant="ghost">
          <RotateCcwIcon className="size-3.5" />
          Сбросить
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Авто-цикл</span>
          <Switch checked={auto} onCheckedChange={setAuto} />
          <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
            {auto ? (
              <PauseIcon className="size-3" />
            ) : (
              <PlayIcon className="size-3" />
            )}
            {users.length}{' '}
            {users.length === 1 ? 'пользователь' : 'пользователей'}
          </span>
        </div>
      </div>

      {/* Stage with multiple targets */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-dashed border-border bg-background/60 p-5 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-3">
          <FakeField label="Заголовок">
            <Input
              ref={titleRef}
              defaultValue="Live Collaboration in Datawrapper"
              onFocus={() => setActiveField('title')}
            />
          </FakeField>
          <FakeField label="Подзаголовок">
            <Input
              ref={subtitleRef}
              defaultValue="Multiple editors. One chart. Zero merge conflicts."
              onFocus={() => setActiveField('subtitle')}
            />
          </FakeField>
          <FakeField label="Описание">
            <Textarea
              ref={descriptionRef}
              rows={3}
              defaultValue="Сурово: курсоры коллег летают по экрану, как чайки над пляжем. Симпатично — и без панических merge-conflict’ов."
              onFocus={() => setActiveField('description')}
            />
          </FakeField>
        </div>

        <div className="flex flex-col gap-3">
          <FakeField label="Превью графика">
            <div
              ref={chartRef}
              role="button"
              tabIndex={0}
              onClick={() => setActiveField('chart')}
              onFocus={() => setActiveField('chart')}
              className="flex aspect-[5/3] cursor-pointer items-end gap-1.5 rounded-lg border border-border bg-card px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {[34, 56, 22, 78, 64, 42, 89, 55, 30, 70].map((h, idx) => (
                <span
                  key={idx}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: `hsl(${250 + idx * 6} 80% ${50 + (idx % 3) * 8}%)`,
                  }}
                />
              ))}
            </div>
          </FakeField>
          <FakeField label="Дата публикации">
            <button
              ref={dateRef}
              type="button"
              onClick={() => setActiveField('date')}
              onFocus={() => setActiveField('date')}
              className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <span className="text-muted-foreground">📅</span>
              20 мая 2026
            </button>
          </FakeField>
          <FakeField label="Действие">
            <Button
              ref={ctaRef}
              onClick={() => setActiveField('cta')}
              onFocus={() => setActiveField('cta')}
              className="w-full"
            >
              Опубликовать график
            </Button>
          </FakeField>
        </div>
      </div>

      <CollaborationCursor target={cursorTarget} users={users} />
    </div>
  );
}

function FakeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Multiple independent cursors at once

function MultipleCursorsShowcase() {
  const cardARef = React.useRef<HTMLDivElement>(null);
  const cardBRef = React.useRef<HTMLDivElement>(null);
  const cardCRef = React.useRef<HTMLDivElement>(null);

  const [layout, setLayout] = React.useState<'a' | 'b'>('a');

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setLayout((cur) => (cur === 'a' ? 'b' : 'a'));
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  // Two cursors that swap which card they live on
  const cursor1Target = layout === 'a' ? cardARef : cardBRef;
  const cursor1Users =
    layout === 'a'
      ? [ALL_USERS[1]!]
      : [ALL_USERS[1]!, ALL_USERS[3]!, ALL_USERS[5]!];

  const cursor2Target = layout === 'a' ? cardBRef : cardCRef;
  const cursor2Users =
    layout === 'a' ? [ALL_USERS[4]!, ALL_USERS[6]!] : [ALL_USERS[4]!];

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-dashed border-border bg-background/60 p-5 sm:grid-cols-3">
      <ShowcaseCard
        ref={cardARef}
        title="Bar chart"
        subtitle="Population 2026"
      />
      <ShowcaseCard ref={cardBRef} title="Line chart" subtitle="Revenue YoY" />
      <ShowcaseCard
        ref={cardCRef}
        title="Map"
        subtitle="Energy mix per region"
      />

      <CollaborationCursor target={cursor1Target} users={cursor1Users} />
      <CollaborationCursor target={cursor2Target} users={cursor2Users} />
    </div>
  );
}

function ShowcaseCard({
  ref,
  title,
  subtitle,
}: {
  ref: React.Ref<HTMLDivElement>;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      ref={ref}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {subtitle}
      </span>
      <span className="text-base font-semibold text-foreground">{title}</span>
      <div className="mt-2 flex h-20 items-end gap-1">
        {[40, 60, 30, 75, 55, 90, 50].map((h, idx) => (
          <span
            key={idx}
            className="flex-1 rounded-sm bg-brand/70"
            style={{ height: `${h}%`, opacity: 0.4 + (idx % 3) * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Attach to anything — visualisation

function FreeFormShowcase() {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const tagRef = React.useRef<HTMLSpanElement>(null);
  const codeRef = React.useRef<HTMLDivElement>(null);

  const targets: {
    label: string;
    handle: React.RefObject<HTMLElement | null>;
    users: CollabUser[];
  }[] = [
    {
      label: 'Кнопка',
      handle: buttonRef as React.RefObject<HTMLElement | null>,
      users: [ALL_USERS[2]!],
    },
    {
      label: 'Заголовок',
      handle: headingRef as React.RefObject<HTMLElement | null>,
      users: [ALL_USERS[5]!, ALL_USERS[7]!],
    },
    {
      label: 'Тег',
      handle: tagRef as React.RefObject<HTMLElement | null>,
      users: [ALL_USERS[3]!],
    },
    {
      label: 'Блок кода',
      handle: codeRef as React.RefObject<HTMLElement | null>,
      users: [ALL_USERS[0]!, ALL_USERS[6]!],
    },
  ];

  const [activeIndex, setActiveIndex] = React.useState(0);
  const { handle: activeHandle, users: activeUsers } = targets[activeIndex]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="mr-2 text-sm text-muted-foreground">
          Прицельтесь на:
        </span>
        {targets.map((t, idx) => (
          <Button
            key={t.label}
            size="sm"
            variant={idx === activeIndex ? 'default' : 'outline'}
            onClick={() => setActiveIndex(idx)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-dashed border-border bg-background/60 p-8">
        <h2
          ref={headingRef}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Любой DOM-узел становится холстом
        </h2>
        <span
          ref={tagRef}
          className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand"
        >
          Бета
        </span>
        <Button ref={buttonRef} size="sm">
          Сохранить
        </Button>
        <div
          ref={codeRef}
          className="mt-2 w-full rounded-xl border border-border bg-code-bg px-4 py-3 font-mono text-sm text-code-foreground"
        >
          <span className="text-code-keyword">{`<CollaborationCursor`}</span>
          {' '}
          <span className="text-code-property">target</span>
          <span>{`=`}</span>
          <span className="text-code-string">{`{ref}`}</span>
          {' '}
          <span className="text-code-property">users</span>
          <span>{`=`}</span>
          <span className="text-code-string">{`{[...]}`}</span>
          {' '}
          <span>{`/>`}</span>
        </div>
      </div>

      <CollaborationCursor target={activeHandle} users={activeUsers} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function CollaborationCursorDemoView() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          Collaboration cursor · v1
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Курсор живой коллаборации
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Прикрепляется к любому DOM-узлу через <code>ref</code>. Анимирует
          добавление и удаление участников в стек, плавно перелетает между
          целями пружинной анимацией. Сделано по референсу{' '}
          <a
            href="https://dribbble.com/shots/25353015-Live-Collaboration-for-Datawrapper"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Live Collaboration for Datawrapper
          </a>
          .
        </p>
      </motion.header>

      <div className="flex flex-col gap-5">
        <DemoCard
          title="Один курсор, много полей"
          description="Кнопки управляют активной целью и составом участников. Включите «Авто-цикл», чтобы посмотреть, как курсор сам перелетает между полями."
        >
          <SingleCursorPlayground />
        </DemoCard>

        <DemoCard
          title="Несколько независимых курсоров"
          description="Каждый курсор — отдельный экземпляр компонента. Цели меняются автоматически, чтобы показать одновременные перелёты."
        >
          <MultipleCursorsShowcase />
        </DemoCard>

        <DemoCard
          title="Прицельтесь во что угодно"
          description="Заголовок, тег, кнопка, блок кода — компонент не делает предположений о том, к чему он прикрепляется. Достаточно ref."
        >
          <FreeFormShowcase />
        </DemoCard>
      </div>
    </main>
  );
}

export default CollaborationCursorDemoView;
