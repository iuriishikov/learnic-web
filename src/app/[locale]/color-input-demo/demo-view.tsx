'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import {
  AlphaSlider,
  ColorCard,
  ColorFieldTrigger,
  ColorInput,
  ColorLabelTrigger,
  ColorPillTrigger,
  ColorSwatchTrigger,
  colorToCss,
  emptyImage,
  EyedropperButton,
  HexInput,
  HueSlider,
  hexToHsv,
  hsvToHex,
  linearGradient,
  OpacityInput,
  Palette,
  PaletteSwatches,
  SaturationValuePicker,
  SolidPicker,
  type ColorValue,
  type HSV,
  type SavedColor,
  type SolidValue,
  solid,
  useEyeDropperAvailable,
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

// Tailwind v4.2 palette — used for the "Brand" / "Gray" demo cards.
const TAILWIND_BRAND: SavedColor[] = [
  { id: 'tw-emerald', hex: '#10B981' },
  { id: 'tw-teal', hex: '#14B8A6' },
  { id: 'tw-sky', hex: '#0EA5E9' },
  { id: 'tw-blue', hex: '#3B82F6' },
  { id: 'tw-indigo', hex: '#6366F1' },
  { id: 'tw-violet', hex: '#8B5CF6' },
  { id: 'tw-fuchsia', hex: '#D946EF' },
  { id: 'tw-pink', hex: '#EC4899' },
  { id: 'tw-rose', hex: '#F43F5E' },
  { id: 'tw-red', hex: '#EF4444' },
  { id: 'tw-orange', hex: '#F97316' },
  { id: 'tw-amber', hex: '#F59E0B' },
  { id: 'tw-yellow', hex: '#EAB308' },
  { id: 'tw-lime', hex: '#84CC16' },
];

const TAILWIND_GRAY: SavedColor[] = [
  { id: 'tw-gray-900', hex: '#111827' },
  { id: 'tw-gray-800', hex: '#1F2937' },
  { id: 'tw-gray-700', hex: '#374151' },
  { id: 'tw-gray-600', hex: '#4B5563' },
  { id: 'tw-gray-500', hex: '#6B7280' },
  { id: 'tw-gray-400', hex: '#9CA3AF' },
  { id: 'tw-gray-300', hex: '#D1D5DB' },
  { id: 'tw-gray-200', hex: '#E5E7EB' },
];

// Mono swatches for the "Custom" palette (matches the dark row in the
// reference). 14 entries — 7 per row.
const CUSTOM_MONO: SavedColor[] = [
  { id: 'c-black', hex: '#000000' },
  { id: 'c-171717', hex: '#171717' },
  { id: 'c-262626', hex: '#262626' },
  { id: 'c-404040', hex: '#404040' },
  { id: 'c-525252', hex: '#525252' },
  { id: 'c-737373', hex: '#737373' },
  { id: 'c-a3a3a3', hex: '#A3A3A3' },
  { id: 'c-d4d4d4', hex: '#D4D4D4' },
  { id: 'c-e5e5e5', hex: '#E5E5E5' },
  { id: 'c-f5f5f5', hex: '#F5F5F5' },
  { id: 'c-white', hex: '#FFFFFF' },
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
// SECTION: New compositions — match the reference's right column

function ColorCardWithPaletteDemo() {
  const ctl = useColor(solid('#7F56D9'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
      <ColorCard value={v} height={104} />
      <PaletteSwatches
        colors={DEFAULT_SAVED}
        activeHex={v.hex}
        onPick={(c) =>
          ctl.setValue({ ...v, hex: c.hex, opacity: c.opacity ?? v.opacity })
        }
      />
      <div className="flex items-stretch gap-2">
        <HexInput
          hex={v.hex}
          opacity={v.opacity}
          onCommit={(hex) => ctl.setValue({ ...v, hex })}
        />
        <OpacityInput
          opacity={v.opacity}
          onCommit={(opacity) => ctl.setValue({ ...v, opacity })}
        />
      </div>
    </div>
  );
}

function CustomPaletteDemo() {
  const ctl = useColor(solid('#171717'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <Palette
        colors={CUSTOM_MONO}
        activeHex={v.hex}
        onPick={(c) => ctl.setValue({ ...v, hex: c.hex })}
      />
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-xs">
        <span className="text-sm font-medium text-foreground">Custom</span>
        <HexInput
          hex={v.hex}
          opacity={v.opacity}
          onCommit={(hex) => ctl.setValue({ ...v, hex })}
        />
      </div>
    </div>
  );
}

function SavedPaletteDropdownDemo() {
  type Set = 'recent' | 'saved' | 'imported';
  const [set, setSet] = React.useState<Set>('saved');
  const ctl = useColor(solid('#171717'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2">
      <Palette
        titleDropdown={{
          value: set,
          onChange: (next) => setSet(next as Set),
          options: [
            { value: 'saved', label: 'Saved' },
            { value: 'recent', label: 'Недавние' },
            { value: 'imported', label: 'Импорт' },
          ],
        }}
        onAdd={() => undefined}
        addLabel="Add"
        colors={set === 'saved' ? CUSTOM_MONO : DEFAULT_SAVED}
        activeHex={v.hex}
        onPick={(c) => ctl.setValue({ ...v, hex: c.hex })}
      />
      <div className="flex items-stretch gap-2">
        <HexInput
          hex={v.hex}
          opacity={v.opacity}
          onCommit={(hex) => ctl.setValue({ ...v, hex })}
        />
        <OpacityInput
          opacity={v.opacity}
          onCommit={(opacity) => ctl.setValue({ ...v, opacity })}
        />
      </div>
    </div>
  );
}

function BrandPaletteDemo() {
  const ctl = useColor(solid('#8B5CF6'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  return (
    <Palette
      className="w-full max-w-[280px]"
      title="Brand"
      subtitle="Tailwind CSS v4.2"
      colors={TAILWIND_BRAND}
      activeHex={v.hex}
      onPick={(c) => ctl.setValue({ ...v, hex: c.hex })}
      primaryAction={{ label: 'Docs', href: 'https://tailwindcss.com/docs/colors' }}
      secondaryAction={{
        label: 'Reset',
        onClick: () => ctl.setValue(solid('#8B5CF6')),
      }}
    />
  );
}

function GrayPaletteDemo() {
  const ctl = useColor(solid('#374151'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  return (
    <Palette
      className="w-full max-w-[280px]"
      title="Gray"
      subtitle="Tailwind CSS v4.2"
      colors={TAILWIND_GRAY}
      activeHex={v.hex}
      onPick={(c) => ctl.setValue({ ...v, hex: c.hex })}
      primaryAction={{ label: 'Docs', href: 'https://tailwindcss.com/docs/colors' }}
      secondaryAction={{
        label: 'Reset',
        onClick: () => ctl.setValue(solid('#374151')),
      }}
    />
  );
}

function EyedropperHueRowDemo() {
  const ctl = useColor(solid('#7F56D9'));
  const v = ctl.value;
  const [hsv, setHsv] = React.useState<HSV>(() =>
    hexToHsv(v.kind === 'solid' ? v.hex : '#7F56D9'),
  );
  const hasEyeDropper = useEyeDropperAvailable();
  if (v.kind !== 'solid') return null;

  const setHue = (h: number) => {
    const next = { ...hsv, h };
    setHsv(next);
    ctl.setValue({ ...v, hex: hsvToHex(next) });
  };

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="flex items-center gap-2">
        {hasEyeDropper && (
          <EyedropperButton onPick={(hex) => ctl.setValue({ ...v, hex })} />
        )}
        <div className="flex-1">
          <HueSlider hue={hsv.h} onChange={setHue} />
        </div>
        <OpacityInput
          opacity={v.opacity}
          onCommit={(opacity) => ctl.setValue({ ...v, opacity })}
        />
      </div>
      <div className="flex items-stretch gap-2">
        <HexInput
          hex={v.hex}
          opacity={v.opacity}
          onCommit={(hex) => ctl.setValue({ ...v, hex })}
        />
        <OpacityInput
          opacity={v.opacity}
          onCommit={(opacity) => ctl.setValue({ ...v, opacity })}
        />
      </div>
    </div>
  );
}

function StandaloneHueDemo() {
  const [hue, setHue] = React.useState(220);
  const [opacity, setOpacity] = React.useState(100);
  return (
    <div className="flex w-full max-w-[320px] items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="flex-1">
        <HueSlider hue={hue} onChange={setHue} />
      </div>
      <OpacityInput opacity={opacity} onCommit={setOpacity} />
    </div>
  );
}

function StandaloneAlphaDemo() {
  const [opacity, setOpacity] = React.useState(100);
  return (
    <div className="flex w-full max-w-[320px] items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="flex-1">
        <AlphaSlider hex="#7F56D9" opacity={opacity} onChange={setOpacity} />
      </div>
      <OpacityInput opacity={opacity} onCommit={setOpacity} />
    </div>
  );
}

function CompactSolidPickerDemo() {
  const ctl = useColor(solid('#4F46E5'));
  if (ctl.value.kind !== 'solid') return null;
  const v: SolidValue = ctl.value;
  return (
    <div className="w-full max-w-[320px] rounded-xl border border-border bg-card p-3 shadow-xs">
      <SolidPicker
        value={v}
        onChange={(next) => ctl.setValue(next)}
        savedColors={DEFAULT_SAVED}
        onAddSaved={() => undefined}
      />
    </div>
  );
}

function SaturationValueOnlyDemo() {
  const ctl = useColor(solid('#9333EA'));
  const v = ctl.value;
  if (v.kind !== 'solid') return null;
  const hsv = hexToHsv(v.hex);
  return (
    <div className="w-full max-w-[260px] rounded-xl border border-border bg-card p-3 shadow-xs">
      <SaturationValuePicker
        hsv={hsv}
        onChange={(next) => ctl.setValue({ ...v, hex: hsvToHex(next) })}
      />
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

        <DemoCard
          title="ColorCard + Palette"
          description="Большая карточка-превью с hex поверх цвета, ниже — сетка сохранённых свотчей и поле hex + прозрачность."
        >
          <ColorCardWithPaletteDemo />
        </DemoCard>

        <DemoCard
          title="Custom palette"
          description="Свотч-сетка без заголовка плюс «Custom» строка с активным цветом и hex-инпутом."
        >
          <CustomPaletteDemo />
        </DemoCard>

        <DemoCard
          title="Saved palette с дропдауном"
          description="Заголовок палитры превращается в селектор — можно переключаться между сохранёнными наборами. Действие «+ Add» справа, hex + opacity снизу."
        >
          <SavedPaletteDropdownDemo />
        </DemoCard>

        <DemoCard
          title="Brand palette"
          description="Заголовок + подзаголовок («Tailwind CSS v4.2»), сетка свотчей и футер с действиями (Docs / Reset)."
        >
          <BrandPaletteDemo />
        </DemoCard>

        <DemoCard
          title="Gray palette"
          description="То же самое, что Brand, но монохромная палитра в одну строку."
        >
          <GrayPaletteDemo />
        </DemoCard>

        <DemoCard
          title="Eyedropper · Hue · Hex"
          description="Композиция из существующих примитивов: пипетка + ползунок Hue + поле прозрачности; ниже отдельная строка hex."
        >
          <EyedropperHueRowDemo />
        </DemoCard>

        <DemoCard
          title="Hue · standalone"
          description="Ползунок Hue без обвязки + поле прозрачности справа."
        >
          <StandaloneHueDemo />
        </DemoCard>

        <DemoCard
          title="Alpha · standalone"
          description="Ползунок альфы с поверхностью-шахматкой + поле прозрачности справа."
        >
          <StandaloneAlphaDemo />
        </DemoCard>

        <DemoCard
          title="Saturation × Value"
          description="2D-пикер яркости/насыщенности — основной примитив SolidPicker'а, доступный отдельно."
        >
          <SaturationValueOnlyDemo />
        </DemoCard>

        <DemoCard
          title="Solid picker без табов"
          description="Полноценный SolidPicker используется как самостоятельный инлайн-компонент — нижняя правая карточка на референсе."
        >
          <CompactSolidPickerDemo />
        </DemoCard>
      </div>
    </main>
  );
}
