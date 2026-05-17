'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { HighlighterIcon, EraserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import { Button } from '@/shared/ui/button';
import {
  ColorInput,
  type SavedColor,
  solid,
  type SolidValue,
} from '@/shared/ui/color-input';
import { overlayFooterButtonCls } from '@/shared/ui/overlay';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import {
  COLOR_ROW_ACCENT,
  COLOR_ROW_HIGHLIGHT,
  COLOR_ROW_NEUTRAL,
  type ColorSwatch,
} from './constants';

// Map rich-editor's preset palette into ColorInput's `savedColors` shape.
function toSaved(palette: readonly ColorSwatch[]): SavedColor[] {
  return palette.map((c) => ({ id: c.id, hex: c.value }));
}

const TEXT_PRESETS: SavedColor[] = [
  ...toSaved(COLOR_ROW_NEUTRAL),
  ...toSaved(COLOR_ROW_ACCENT),
];

const HIGHLIGHT_PRESETS: SavedColor[] = toSaved(COLOR_ROW_HIGHLIGHT);

const DEFAULT_TEXT_COLOR = '#111111';
const DEFAULT_HIGHLIGHT_COLOR = '#FEF08A';

export function ColorButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const activeColor = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').color as string | undefined) ?? null,
  });
  const swatchColor = activeColor ?? DEFAULT_TEXT_COLOR;

  const apply = useCallback(
    (color: string | null) => {
      const chain = editor.chain().focus();
      if (color === null) chain.unsetColor().run();
      else chain.setColor(color).run();
    },
    [editor],
  );

  const value: SolidValue = useMemo(
    () => solid(activeColor ?? DEFAULT_TEXT_COLOR, 100),
    [activeColor],
  );

  return (
    <ColorInput
      value={value}
      onValueChange={(next) => {
        if (next.kind === 'solid') apply(next.hex);
      }}
      modes={['solid']}
      savedColors={TEXT_PRESETS}
      align="start"
      contentProps={{ 'data-rich-editor-portal': '' }}
    >
      <PopoverPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.color')}
          />
        }
      >
        <span
          aria-hidden
          className="block size-4 rounded-full ring-1 ring-foreground/15"
          style={{ backgroundColor: swatchColor }}
        />
      </PopoverPrimitive.Trigger>
    </ColorInput>
  );
}

export function HighlightButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const activeColor = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').backgroundColor as
        | string
        | undefined) ?? null,
  });

  const apply = useCallback(
    (color: string | null) => {
      const chain = editor.chain().focus();
      if (color === null) chain.unsetBackgroundColor().run();
      else chain.setBackgroundColor(color).run();
    },
    [editor],
  );

  const value: SolidValue = useMemo(
    () => solid(activeColor ?? DEFAULT_HIGHLIGHT_COLOR, 100),
    [activeColor],
  );

  return (
    <ColorInput
      value={value}
      onValueChange={(next) => {
        if (next.kind === 'solid') apply(next.hex);
      }}
      modes={['solid']}
      savedColors={HIGHLIGHT_PRESETS}
      align="start"
      contentProps={{ 'data-rich-editor-portal': '' }}
      popoverFooter={
        <PopoverPrimitive.Close
          className={overlayFooterButtonCls}
          onClick={() => apply(null)}
        >
          <EraserIcon className="size-4" aria-hidden />
          <span>{t('highlight.clear')}</span>
        </PopoverPrimitive.Close>
      }
    >
      <PopoverPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.highlight')}
          />
        }
      >
        <span className="relative inline-flex">
          <HighlighterIcon className="size-4" />
          <span
            aria-hidden
            className="absolute -bottom-0.5 left-1/2 h-1 w-3.5 -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: activeColor ?? 'var(--brand)',
            }}
          />
        </span>
      </PopoverPrimitive.Trigger>
    </ColorInput>
  );
}
