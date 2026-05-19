'use client';

import * as React from 'react';
import {
  ChevronDownIcon,
  RotateCwIcon,
  Trash2Icon,
  UploadCloudIcon,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';
import { Slider } from '@/shared/ui/slider';

import { clamp } from './lib';
import { CHECKER_BG } from './pickers';
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  type ImageAdjustments,
  type ImageValue,
} from './types';

const ADJUSTMENTS: { key: keyof ImageAdjustments; label: string }[] = [
  { key: 'exposure', label: 'Экспозиция' },
  { key: 'contrast', label: 'Контраст' },
  { key: 'saturation', label: 'Насыщенность' },
  { key: 'temperature', label: 'Температура' },
  { key: 'tint', label: 'Оттенок' },
  { key: 'highlights', label: 'Света' },
  { key: 'shadows', label: 'Тени' },
];

const FIT_LABEL: Record<NonNullable<ImageValue['fit']>, string> = {
  fill: 'Заполнить',
  cover: 'Покрытие',
  contain: 'Вписать',
  tile: 'Плитка',
};

export function ImagePicker({
  value,
  onChange,
}: {
  value: ImageValue;
  onChange: (next: ImageValue) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  // Track every object-URL we created so we can revoke them on unmount or
  // when the user replaces / removes the image. Without this, every uploaded
  // file leaks a Blob reference for the lifetime of the page.
  const createdUrlsRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const revokeIfOwned = (url: string) => {
    if (createdUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      createdUrlsRef.current.delete(url);
    }
  };

  const onFile = (file: File | null | undefined) => {
    if (!file) return;
    revokeIfOwned(value.src);
    const url = URL.createObjectURL(file);
    createdUrlsRef.current.add(url);
    onChange({ ...value, src: url });
  };

  const onClearImage = () => {
    revokeIfOwned(value.src);
    onChange({ ...value, src: '' });
  };

  const filterCss = adjustmentsToFilter(value.adjustments);
  const fitToObjectFit: Record<NonNullable<ImageValue['fit']>, string> = {
    fill: 'fill',
    cover: 'cover',
    contain: 'contain',
    tile: 'none',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Upload / preview area. Matches the project's standard upload
          placeholder pattern (see `features/auth/components/cover-uploader`):
          dashed border + muted bg in idle state, brand-tinted on drag-over,
          icon inside a small surface card. The transparent-checker background
          is shown ONLY when an image is present so alpha/PNG holes are
          visible. */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) onFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group/dropzone relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border transition-colors',
          'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 focus-visible:outline-none',
          dragOver && 'border-brand',
          value.src && 'border-solid border-input/60',
        )}
        style={{ background: CHECKER_BG }}
      >
        {value.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- object-URL preview, optimization not applicable
          <img
            alt=""
            src={value.src}
            className="absolute inset-0 size-full"
            style={{
              objectFit: fitToObjectFit[value.fit] as React.CSSProperties['objectFit'],
              filter: filterCss,
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-sm">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors',
                dragOver && 'border-brand text-brand',
              )}
            >
              <UploadCloudIcon className="size-3.5" aria-hidden />
              Нажмите чтобы загрузить
            </span>
            <p className="text-xs text-muted-foreground">
              или перетащите файл
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {/* Fit + reset + remove */}
      <div className="flex items-center gap-2">
        <FitMenu value={value.fit} onChange={(fit) => onChange({ ...value, fit })} />
        <button
          type="button"
          onClick={() =>
            onChange({ ...value, adjustments: { ...DEFAULT_IMAGE_ADJUSTMENTS } })
          }
          aria-label="Сбросить корректировки"
          className="ml-auto inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
        >
          <RotateCwIcon className="size-3.5" />
        </button>
        {value.src && (
          <button
            type="button"
            onClick={onClearImage}
            aria-label="Убрать изображение"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-none"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Adjustments */}
      <div className="flex flex-col gap-2 pt-1">
        {ADJUSTMENTS.map(({ key, label }) => (
          <div
            key={key}
            className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2 text-xs"
          >
            <span className="text-muted-foreground">{label}</span>
            <Slider
              min={-100}
              max={100}
              value={[value.adjustments[key]]}
              onValueChange={(next) => {
                const n = Array.isArray(next) ? next[0] : next;
                onChange({
                  ...value,
                  adjustments: {
                    ...value.adjustments,
                    [key]: clamp(typeof n === 'number' ? n : 0, -100, 100),
                  },
                });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Fit menu

function FitMenu({
  value,
  onChange,
}: {
  value: ImageValue['fit'];
  onChange: (next: ImageValue['fit']) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-input bg-transparent px-2 text-xs font-medium text-foreground shadow-xs outline-none transition-colors',
          'hover:bg-muted/50',
          'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        )}
        aria-label="Заполнение"
      >
        {FIT_LABEL[value]}
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent size="sm" align="start" className="min-w-[8rem]">
        <MenuGroup>
          <MenuRadioGroup
            value={value}
            onValueChange={(v) =>
              onChange(v as NonNullable<ImageValue['fit']>)
            }
          >
            <MenuRadioItem value="fill">Заполнить</MenuRadioItem>
            <MenuRadioItem value="cover">Покрытие</MenuRadioItem>
            <MenuRadioItem value="contain">Вписать</MenuRadioItem>
            <MenuRadioItem value="tile">Плитка</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Adjustments → CSS filter (visual approximation, not colorimetric)

function adjustmentsToFilter(a: ImageAdjustments): string {
  const parts: string[] = [];
  if (a.exposure !== 0) parts.push(`brightness(${1 + a.exposure / 100})`);
  if (a.contrast !== 0) parts.push(`contrast(${1 + a.contrast / 100})`);
  if (a.saturation !== 0) parts.push(`saturate(${1 + a.saturation / 100})`);
  if (a.temperature !== 0)
    parts.push(`sepia(${clamp(a.temperature, 0, 100) / 100})`);
  if (a.tint !== 0) parts.push(`hue-rotate(${(a.tint / 100) * 30}deg)`);
  if (a.highlights !== 0)
    parts.push(`brightness(${1 + (a.highlights / 200)})`);
  if (a.shadows !== 0) parts.push(`brightness(${1 - (a.shadows / 400)})`);
  return parts.join(' ');
}
