'use client';

import * as React from 'react';
import { ChevronDownIcon, PlusIcon, RotateCwIcon, Trash2Icon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';

import { CompactInput, CompactInputAddon } from './compact-input';
import {
  clamp,
  gradientToCss,
  hexAlphaToRgba,
  normalizeHex,
} from './lib';
import { CHECKER_BG } from './pickers';
import { SavedColors } from './saved-colors';
import type { GradientStop, GradientValue } from './types';

const nextStopId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `stop-${crypto.randomUUID()}`;
  }
  return `stop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const TYPE_LABEL: Record<GradientValue['type'], string> = {
  linear: 'Линейный',
  radial: 'Радиальный',
};

export function GradientPicker({
  value,
  onChange,
  savedGradients,
}: {
  value: GradientValue;
  onChange: (next: GradientValue) => void;
  savedGradients?: { id: string; gradient: GradientValue }[];
}) {
  const sorted = React.useMemo(
    () => [...value.stops].sort((a, b) => a.position - b.position),
    [value.stops],
  );
  const [activeStopId, setActiveStopId] = React.useState<string>(
    () => sorted[0]?.id ?? '',
  );

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    onChange({
      ...value,
      stops: value.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const addStop = () => {
    const newStop: GradientStop = {
      id: nextStopId(),
      position: 50,
      hex: '#FFFFFF',
      opacity: 100,
    };
    onChange({ ...value, stops: [...value.stops, newStop] });
    setActiveStopId(newStop.id);
  };

  const removeStop = (id: string) => {
    if (value.stops.length <= 2) return;
    const next = value.stops.filter((s) => s.id !== id);
    onChange({ ...value, stops: next });
    if (id === activeStopId) setActiveStopId(next[0]?.id ?? '');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Large gradient preview */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-lg shadow-inner ring-1 ring-foreground/10"
        style={{ background: CHECKER_BG }}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{ background: gradientToCss(value) }}
        />
      </div>

      {/* Stops bar (visual scrubber) — outer wrapper has no `overflow-hidden`
          so the stop thumbs at the 0%/100% edges are not clipped in half. */}
      <div className="relative h-4 w-full">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-foreground/10"
          style={{
            background: `linear-gradient(to right, ${sorted
              .map((s) => `${hexAlphaToRgba(s.hex, s.opacity)} ${s.position}%`)
              .join(', ')}), ${CHECKER_BG}`,
          }}
        />
        {sorted.map((stop) => (
          <button
            key={stop.id}
            type="button"
            onClick={() => setActiveStopId(stop.id)}
            className={cn(
              'absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.3)] transition-transform',
              activeStopId === stop.id && 'ring-2 ring-brand ring-offset-1 ring-offset-popover',
            )}
            style={{
              left: `${clamp(stop.position, 0, 100)}%`,
              backgroundColor: stop.hex,
            }}
            aria-label={`Стоп на ${Math.round(stop.position)}%`}
          />
        ))}
      </div>

      {/* Type + angle row */}
      <div className="flex items-stretch gap-2">
        <TypeMenu
          value={value.type}
          onChange={(type) => onChange({ ...value, type })}
        />
        {value.type === 'linear' && (
          <AngleControl
            angle={value.angle}
            onChange={(angle) => onChange({ ...value, angle })}
          />
        )}
      </div>

      {/* Stops list */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-foreground/80">
          <span>Стопы</span>
          <button
            type="button"
            onClick={addStop}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
          >
            <PlusIcon className="size-3.5" />
            Добавить
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {sorted.map((stop) => (
            <StopRow
              key={stop.id}
              stop={stop}
              isActive={stop.id === activeStopId}
              onActivate={() => setActiveStopId(stop.id)}
              onUpdate={(patch) => updateStop(stop.id, patch)}
              onRemove={() => removeStop(stop.id)}
              canRemove={value.stops.length > 2}
            />
          ))}
        </div>
      </div>

      {savedGradients && savedGradients.length > 0 && (
        <SavedColors
          colors={savedGradients.map((g) => ({
            id: g.id,
            hex: g.gradient.stops[0]?.hex ?? '#000000',
          }))}
          onPick={(c) => {
            const found = savedGradients.find((g) => g.id === c.id);
            if (found) onChange(found.gradient);
          }}
          label="Сохранённые"
          addLabel="Добавить"
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Type menu (Linear / Radial)

function TypeMenu({
  value,
  onChange,
}: {
  value: GradientValue['type'];
  onChange: (next: GradientValue['type']) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-input bg-transparent px-2 text-xs font-medium text-foreground shadow-xs outline-none transition-colors',
          'hover:bg-muted/50',
          'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        )}
        aria-label="Тип градиента"
      >
        {TYPE_LABEL[value]}
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent size="sm" align="start" className="min-w-[8rem]">
        <MenuGroup>
          <MenuRadioGroup
            value={value}
            onValueChange={(v) => onChange(v as GradientValue['type'])}
          >
            <MenuRadioItem value="linear">Линейный</MenuRadioItem>
            <MenuRadioItem value="radial">Радиальный</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Angle control

function AngleControl({
  angle,
  onChange,
}: {
  angle: number;
  onChange: (next: number) => void;
}) {
  const rounded = Math.round(angle);
  const [draft, setDraft] = React.useState(`${rounded}`);
  const [prevAngle, setPrevAngle] = React.useState(rounded);
  if (prevAngle !== rounded) {
    setPrevAngle(rounded);
    setDraft(`${rounded}`);
  }

  return (
    <CompactInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = parseFloat(draft);
        if (!Number.isNaN(n)) onChange(clamp(n, 0, 360));
        else setDraft(`${rounded}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      inputMode="numeric"
      spellCheck={false}
      shellClassName="flex-1 min-w-0"
      className="text-right font-mono tabular-nums"
      trailing={
        <>
          <CompactInputAddon className="pl-0 pr-1 text-muted-foreground">
            °
          </CompactInputAddon>
          <button
            type="button"
            onClick={() => onChange((angle + 45) % 360)}
            className="mr-1 inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
            aria-label="Повернуть градиент на 45°"
          >
            <RotateCwIcon className="size-3" />
          </button>
        </>
      }
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Stop row

function StopRow({
  stop,
  isActive,
  onActivate,
  onUpdate,
  onRemove,
  canRemove,
}: {
  stop: GradientStop;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (patch: Partial<GradientStop>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const posRounded = Math.round(stop.position);
  const opacityRounded = Math.round(stop.opacity);
  const hexBare = stop.hex.replace(/^#/, '');

  const [posDraft, setPosDraft] = React.useState(`${posRounded}`);
  const [hexDraft, setHexDraft] = React.useState(hexBare);
  const [opacityDraft, setOpacityDraft] = React.useState(`${opacityRounded}`);

  const [prevPos, setPrevPos] = React.useState(posRounded);
  const [prevHex, setPrevHex] = React.useState(stop.hex);
  const [prevOpacity, setPrevOpacity] = React.useState(opacityRounded);
  if (prevPos !== posRounded) {
    setPrevPos(posRounded);
    setPosDraft(`${posRounded}`);
  }
  if (prevHex !== stop.hex) {
    setPrevHex(stop.hex);
    setHexDraft(hexBare);
  }
  if (prevOpacity !== opacityRounded) {
    setPrevOpacity(opacityRounded);
    setOpacityDraft(`${opacityRounded}`);
  }

  return (
    <div
      onClick={onActivate}
      className={cn(
        'group flex items-stretch gap-1.5 rounded-md p-1 transition-colors',
        isActive ? 'bg-muted/60' : 'hover:bg-muted/30',
      )}
    >
      <CompactInput
        value={posDraft}
        onChange={(e) => setPosDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(posDraft);
          if (!Number.isNaN(n)) onUpdate({ position: clamp(n, 0, 100) });
          else setPosDraft(`${posRounded}`);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        inputMode="numeric"
        spellCheck={false}
        className="w-14 text-right font-mono tabular-nums"
        trailing={
          <CompactInputAddon className="pl-0 pr-2 text-muted-foreground">
            %
          </CompactInputAddon>
        }
      />
      <CompactInput
        value={hexDraft}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={() => {
          const norm = normalizeHex(hexDraft);
          if (norm) onUpdate({ hex: norm });
          else setHexDraft(hexBare);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        spellCheck={false}
        className="flex-1 font-mono"
        leading={
          <CompactInputAddon className="pl-2 pr-0">
            <span
              aria-hidden
              className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
              style={{ backgroundColor: hexAlphaToRgba(stop.hex, stop.opacity) }}
            />
          </CompactInputAddon>
        }
      />
      <CompactInput
        value={opacityDraft}
        onChange={(e) => setOpacityDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(opacityDraft);
          if (!Number.isNaN(n)) onUpdate({ opacity: clamp(n, 0, 100) });
          else setOpacityDraft(`${opacityRounded}`);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        inputMode="numeric"
        spellCheck={false}
        className="w-14 text-right font-mono tabular-nums"
        trailing={
          <CompactInputAddon className="pl-0 pr-2 text-muted-foreground">
            %
          </CompactInputAddon>
        }
      />
      {canRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Удалить стоп"
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-none"
        >
          <Trash2Icon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
