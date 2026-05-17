'use client';

import * as React from 'react';
import { XIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { overlayPopupChromeCls, overlaySeparatorCls } from '@/shared/ui/overlay';
import { Popover } from '@/shared/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { GradientPicker } from './gradient-picker';
import { ImagePicker } from './image-picker';
import { emptyImage, linearGradient, solid } from './lib';
import type { SavedColor } from './saved-colors';
import { SolidPicker } from './solid-picker';
import { InsideColorInputContext } from './triggers';
import type {
  ColorMode,
  ColorValue,
  GradientValue,
  ImageValue,
  SolidValue,
} from './types';

type Side = React.ComponentProps<typeof PopoverPrimitive.Positioner>['side'];
type Align = React.ComponentProps<typeof PopoverPrimitive.Positioner>['align'];

export type ColorInputProps = {
  value: ColorValue;
  onValueChange: (next: ColorValue) => void;
  /** Restrict to specific modes. Defaults to all three. */
  modes?: ColorMode[];
  savedColors?: SavedColor[];
  onAddSavedColor?: (hex: string, opacity: number) => void;
  savedGradients?: { id: string; gradient: GradientValue }[];
  /** Override popover side / align. */
  side?: Side;
  align?: Align;
  /** Force the popover open (for previews). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
  /** Extra props (e.g. `data-*` attributes) forwarded to the popup element.
   *  Useful for things like `data-rich-editor-portal=""` that downstream code
   *  detects via `closest('[data-…]')`. Typed as a permissive record because
   *  Base UI's Popup props don't allow arbitrary `data-*` keys. */
  contentProps?: Record<string, unknown>;
  /** Optional content rendered at the bottom of the popover, after the tab
   *  panels. Use it for actions like "Clear" / "Reset" that should always be
   *  visible regardless of the active mode. */
  popoverFooter?: React.ReactNode;
  children: React.ReactNode;
};

const ALL_MODES: ColorMode[] = ['solid', 'gradient', 'image'];

export function ColorInput({
  value,
  onValueChange,
  modes = ALL_MODES,
  savedColors,
  onAddSavedColor,
  savedGradients,
  side,
  align,
  open,
  defaultOpen,
  onOpenChange,
  contentClassName,
  contentProps,
  popoverFooter,
  children,
}: ColorInputProps) {
  const activeMode = value.kind;

  const handleModeChange = (mode: ColorMode) => {
    if (mode === value.kind) return;
    if (mode === 'solid') onValueChange(coerceToSolid(value));
    else if (mode === 'gradient') onValueChange(coerceToGradient(value));
    else if (mode === 'image') onValueChange(coerceToImage(value));
  };

  const showTabs = modes.length > 1;

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <InsideColorInputContext.Provider value={true}>
        {children}
      </InsideColorInputContext.Provider>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side={side ?? 'bottom'}
          align={align ?? 'center'}
          sideOffset={8}
          className="isolate z-50 outline-none"
        >
          <PopoverPrimitive.Popup
            {...(contentProps as Record<string, unknown>)}
            data-slot="color-input-popup"
            className={cn(
              overlayPopupChromeCls,
              'flex w-[320px] flex-col text-sm',
              contentClassName,
              typeof contentProps?.className === 'string'
                ? contentProps.className
                : undefined,
            )}
          >
            <Tabs
              value={activeMode}
              onValueChange={(v) => handleModeChange(v as ColorMode)}
              className="gap-0"
            >
              {showTabs && (
                <>
                  <div className="flex items-center justify-between gap-2 pl-3 pr-1.5">
                    <TabsList
                      variant="line"
                      className="h-9 gap-2 bg-transparent p-0"
                    >
                      {modes.includes('solid') && (
                        <TabsTrigger
                          value="solid"
                          className="px-0 text-xs font-medium"
                        >
                          Цвет
                        </TabsTrigger>
                      )}
                      {modes.includes('gradient') && (
                        <TabsTrigger
                          value="gradient"
                          className="px-0 text-xs font-medium"
                        >
                          Градиент
                        </TabsTrigger>
                      )}
                      {modes.includes('image') && (
                        <TabsTrigger
                          value="image"
                          className="px-0 text-xs font-medium"
                        >
                          Изображение
                        </TabsTrigger>
                      )}
                    </TabsList>
                    <PopoverPrimitive.Close
                      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
                      aria-label="Закрыть"
                    >
                      <XIcon className="size-4" />
                    </PopoverPrimitive.Close>
                  </div>
                  <div className={overlaySeparatorCls} aria-hidden />
                </>
              )}

              <div className="flex flex-col gap-3 p-3">
                <TabsContent value="solid" className="m-0 flex-1">
                  {value.kind === 'solid' ? (
                    <SolidPicker
                      value={value}
                      onChange={onValueChange}
                      savedColors={savedColors}
                      onAddSaved={
                        onAddSavedColor
                          ? () => onAddSavedColor(value.hex, value.opacity)
                          : undefined
                      }
                    />
                  ) : null}
                </TabsContent>
                <TabsContent value="gradient" className="m-0 flex-1">
                  {value.kind === 'gradient' ? (
                    <GradientPicker
                      value={value}
                      onChange={onValueChange}
                      savedGradients={savedGradients}
                    />
                  ) : null}
                </TabsContent>
                <TabsContent value="image" className="m-0 flex-1">
                  {value.kind === 'image' ? (
                    <ImagePicker value={value} onChange={onValueChange} />
                  ) : null}
                </TabsContent>
              </div>
              {popoverFooter && (
                <>
                  <div className={overlaySeparatorCls} aria-hidden />
                  <div data-slot="color-input-footer">{popoverFooter}</div>
                </>
              )}
            </Tabs>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Mode coercion helpers — preserve as much of the previous value as possible.

function coerceToSolid(v: ColorValue): SolidValue {
  if (v.kind === 'solid') return v;
  if (v.kind === 'gradient') {
    const first = v.stops[0];
    return solid(first?.hex ?? '#7F56D9', first?.opacity ?? 100);
  }
  return solid('#7F56D9', 100);
}

function coerceToGradient(v: ColorValue): GradientValue {
  if (v.kind === 'gradient') return v;
  if (v.kind === 'solid') {
    return linearGradient(
      [
        { hex: v.hex, position: 0, opacity: v.opacity },
        { hex: '#FFFFFF', position: 100, opacity: v.opacity },
      ],
      90,
    );
  }
  return linearGradient(
    [
      { hex: '#7F56D9', position: 0 },
      { hex: '#432F73', position: 100 },
    ],
    90,
  );
}

function coerceToImage(v: ColorValue): ImageValue {
  if (v.kind === 'image') return v;
  return emptyImage();
}
