'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import {
  ColorFieldTrigger,
  ColorInput,
  ColorLabelTrigger,
  ColorPillTrigger,
  ColorSwatchTrigger,
  colorToCss,
  emptyImage,
  linearGradient,
  type ColorValue,
  type SavedColor,
  solid,
} from '@/shared/ui/color-input';

const DEFAULT_SAVED: SavedColor[] = [
  { id: 's1', hex: '#34A853' },
  { id: 's2', hex: '#2A65F0' },
  { id: 's3', hex: '#1F33EE' },
  { id: 's4', hex: '#7F3BE0' },
  { id: 's5', hex: '#C434D7' },
  { id: 's6', hex: '#C7475C' },
  { id: 's7', hex: '#E25E36' },
  { id: 's8', hex: '#7F56D9' },
];

// ──────────────────────────────────────────────────────────────────────────
// Demo card wrapper (mirrors menu-demo.tsx style)

function DemoCard({
  title,
  description,
  children,
  spread = 'wrap',
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  spread?: 'wrap' | 'stack' | 'grid';
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
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div
        className={cn(
          spread === 'wrap' && 'flex flex-wrap items-center gap-6',
          spread === 'stack' && 'flex flex-col gap-4',
          spread === 'grid' && 'grid grid-cols-1 gap-5 md:grid-cols-2',
        )}
      >
        {children}
      </div>
    </motion.section>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </span>
  );
}

function TriggerRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <StateLabel>{label}</StateLabel>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Hooks per demo — each card owns its own value state.

function useColor<T extends ColorValue = ColorValue>(initial: T) {
  const [value, setValue] = React.useState<ColorValue>(initial);
  return { value, setValue };
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION: Trigger variants

function SwatchTriggers() {
  const sm = useColor(solid('#7F56D9'));
  const md = useColor(solid('#7F56D9'));
  const lg = useColor(solid('#7F56D9'));
  return (
    <div className="flex flex-col gap-5">
      <TriggerRow label="Swatch · размеры">
        <ColorInput
          value={sm.value}
          onValueChange={sm.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorSwatchTrigger value={sm.value} size="sm" />
        </ColorInput>
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorSwatchTrigger value={md.value} size="md" />
        </ColorInput>
        <ColorInput
          value={lg.value}
          onValueChange={lg.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorSwatchTrigger value={lg.value} size="lg" />
        </ColorInput>
      </TriggerRow>
      <TriggerRow label="Swatch · состояния (обычное, focused, disabled)">
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorSwatchTrigger value={md.value} size="md" />
        </ColorInput>
        <ColorSwatchTrigger value={md.value} size="md" forceFocus />
        <ColorSwatchTrigger value={md.value} size="md" disabled />
      </TriggerRow>
    </div>
  );
}

function PillTriggers() {
  const sm = useColor(solid('#7F56D9'));
  const md = useColor(solid('#7F56D9', 80));
  return (
    <div className="flex flex-col gap-5">
      <TriggerRow label="Pill · размеры">
        <ColorInput
          value={sm.value}
          onValueChange={sm.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorPillTrigger value={sm.value} size="sm" />
        </ColorInput>
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorPillTrigger value={md.value} size="md" />
        </ColorInput>
      </TriggerRow>
      <TriggerRow label="Pill · состояния">
        <ColorInput
          value={sm.value}
          onValueChange={sm.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorPillTrigger value={sm.value} />
        </ColorInput>
        <ColorPillTrigger value={sm.value} forceFocus />
        <ColorPillTrigger value={sm.value} disabled />
      </TriggerRow>
    </div>
  );
}

function LabelTriggers() {
  const sm = useColor(solid('#7F56D9'));
  const md = useColor(solid('#7F56D9'));
  return (
    <div className="flex flex-col gap-5">
      <TriggerRow label="Labeled · размеры">
        <ColorInput
          value={sm.value}
          onValueChange={sm.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={sm.value} label="Цвет" size="sm" />
        </ColorInput>
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={md.value} label="Цвет" size="md" />
        </ColorInput>
      </TriggerRow>
      <TriggerRow label="Labeled · состояния">
        <ColorInput
          value={sm.value}
          onValueChange={sm.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={sm.value} label="Цвет" />
        </ColorInput>
        <ColorLabelTrigger value={sm.value} label="Цвет" forceFocus />
        <ColorLabelTrigger value={sm.value} label="Цвет" disabled />
      </TriggerRow>
      <TriggerRow label="Labeled · произвольные подписи">
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={md.value} label="Brand" size="md" />
        </ColorInput>
        <ColorInput
          value={md.value}
          onValueChange={md.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={md.value} label="Фон" size="md" />
        </ColorInput>
      </TriggerRow>
    </div>
  );
}

function FieldTriggers() {
  const a = useColor(solid('#7F56D9'));
  const b = useColor(solid('#7F56D9'));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Цвет</label>
          <ColorInput
            value={a.value}
            onValueChange={a.setValue}
            savedColors={DEFAULT_SAVED}
          >
            <ColorFieldTrigger value={a.value} />
          </ColorInput>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Цвет · forced focus
          </label>
          <ColorFieldTrigger value={b.value} forceFocus />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <StateLabel>Disabled</StateLabel>
          <ColorFieldTrigger value={b.value} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <StateLabel>Маленький</StateLabel>
          <ColorInput
            value={b.value}
            onValueChange={b.setValue}
            savedColors={DEFAULT_SAVED}
          >
            <ColorFieldTrigger value={b.value} size="sm" />
          </ColorInput>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION: Modes

function SolidModeDemo() {
  const ctl = useColor(solid('#7F56D9'));
  return (
    <ColorInput
      value={ctl.value}
      onValueChange={ctl.setValue}
      modes={['solid']}
      savedColors={DEFAULT_SAVED}
    >
      <ColorPillTrigger value={ctl.value} size="md" />
    </ColorInput>
  );
}

function GradientModeDemo() {
  const ctl = useColor(
    linearGradient(
      [
        { hex: '#7F56D9', position: 0 },
        { hex: '#432F73', position: 100 },
      ],
      135,
    ),
  );
  return (
    <ColorInput
      value={ctl.value}
      onValueChange={ctl.setValue}
      modes={['gradient']}
      savedGradients={[
        {
          id: 'g1',
          gradient: linearGradient(
            [
              { hex: '#7F56D9', position: 0 },
              { hex: '#FF6B6B', position: 100 },
            ],
            90,
          ),
        },
        {
          id: 'g2',
          gradient: linearGradient(
            [
              { hex: '#34A853', position: 0 },
              { hex: '#2A65F0', position: 100 },
            ],
            45,
          ),
        },
      ]}
    >
      <ColorLabelTrigger value={ctl.value} label="Градиент" size="md" />
    </ColorInput>
  );
}

function ImageModeDemo() {
  const ctl = useColor(emptyImage());
  return (
    <ColorInput
      value={ctl.value}
      onValueChange={ctl.setValue}
      modes={['image']}
    >
      <ColorLabelTrigger value={ctl.value} label="Изображение" size="md" />
    </ColorInput>
  );
}

function AllModesDemo() {
  const ctl = useColor<ColorValue>(solid('#7F56D9'));
  return (
    <ColorInput
      value={ctl.value}
      onValueChange={ctl.setValue}
      savedColors={DEFAULT_SAVED}
    >
      <ColorFieldTrigger value={ctl.value} />
    </ColorInput>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION: Color sets / palettes — bound triggers driven by a single state

function ConnectedSwatches() {
  const ctl = useColor(solid('#7F56D9', 80));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Все триггеры ниже привязаны к одному состоянию — открой любой и измени
        значение, остальные обновятся.
      </p>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <ColorInput
          value={ctl.value}
          onValueChange={ctl.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorSwatchTrigger value={ctl.value} size="lg" />
        </ColorInput>
        <ColorInput
          value={ctl.value}
          onValueChange={ctl.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorPillTrigger value={ctl.value} size="md" />
        </ColorInput>
        <ColorInput
          value={ctl.value}
          onValueChange={ctl.setValue}
          savedColors={DEFAULT_SAVED}
        >
          <ColorLabelTrigger value={ctl.value} label="Цвет" size="md" />
        </ColorInput>
        <div className="min-w-[220px] flex-1">
          <ColorInput
            value={ctl.value}
            onValueChange={ctl.setValue}
            savedColors={DEFAULT_SAVED}
          >
            <ColorFieldTrigger value={ctl.value} />
          </ColorInput>
        </div>
        <div
          aria-hidden
          className="size-12 shrink-0 rounded-lg border border-foreground/10 shadow-inner"
          style={{ background: colorToCss(ctl.value) }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// View

export function ColorInputDemoView() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          ColorInput · v1
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          ColorInput — выбор цвета, градиента и изображения
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Универсальный компонент выбора заливки: solid-цвета с альфой,
          линейные/радиальные градиенты со стопами, загружаемые изображения с
          набором корректировок. Четыре варианта триггера (swatch, pill,
          labeled, field), все состояния и режимы.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DemoCard
          title="Swatch trigger"
          description="Минимальный триггер — просто кружок текущего цвета. Три размера (sm / md / lg) и все состояния."
          spread="stack"
        >
          <SwatchTriggers />
        </DemoCard>

        <DemoCard
          title="Pill trigger"
          description="Пилюля с цветной точкой, hex-значением и процентом непрозрачности. Подходит для тулбаров и компактных UI."
          spread="stack"
        >
          <PillTriggers />
        </DemoCard>

        <DemoCard
          title="Labeled trigger"
          description="Пилюля с произвольным лейблом и chevron'ом. Подходит когда нужна понятная подпись («Color», «Brand», «Background»)."
          spread="stack"
        >
          <LabelTriggers />
        </DemoCard>

        <DemoCard
          title="Field trigger"
          description="Полноценная Input-строка с лидирующим swatch'ем, hex и chevron'ом. Используется в формах."
          spread="stack"
        >
          <FieldTriggers />
        </DemoCard>

        <DemoCard
          title="Solid mode"
          description="Только выбор сплошного цвета. SV-квадрат, hue, alpha, hex/RGB/HSV, saved-палитра, EyeDropper если поддерживается."
        >
          <SolidModeDemo />
        </DemoCard>

        <DemoCard
          title="Gradient mode"
          description="Линейный или радиальный градиент. Угол поворота, добавление/удаление стопов, индивидуальная альфа на стопе."
        >
          <GradientModeDemo />
        </DemoCard>

        <DemoCard
          title="Image mode"
          description="Загрузка картинки по клику или drag &amp; drop. Fit (Fill / Cover / Contain / Tile) и 7 корректировок: exposure, contrast, saturation, temperature, tint, highlights, shadows."
        >
          <ImageModeDemo />
        </DemoCard>

        <DemoCard
          title="All modes"
          description="Один триггер с тремя вкладками Solid / Gradient / Image. Значение автоматически конвертируется между режимами."
        >
          <AllModesDemo />
        </DemoCard>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2"
        >
          <DemoCard
            title="Connected triggers"
            description="Все триггеры в этой карточке привязаны к одному значению — изменения в любом popover'е немедленно отражаются во всех остальных."
            spread="stack"
          >
            <ConnectedSwatches />
          </DemoCard>
        </motion.div>
      </div>
    </main>
  );
}
