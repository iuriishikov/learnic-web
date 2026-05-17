'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { TypeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

import {
  DEFAULT_FONT_ID,
  DEFAULT_FONT_SIZE,
  FONT_OPTIONS,
  FONT_SIZES,
  type FontOptionId,
} from './constants';

export function FontFamilySelect({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');

  const activeFont = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').fontFamily as string | undefined) ??
      null,
  });

  const activeId: FontOptionId = useMemo(() => {
    if (!activeFont) return DEFAULT_FONT_ID;
    const match = FONT_OPTIONS.find((option) =>
      activeFont.includes(option.cssValue.split(',')[0]?.trim() ?? ''),
    );
    return match?.id ?? DEFAULT_FONT_ID;
  }, [activeFont]);

  const onValueChange = useCallback(
    (id: string | null) => {
      const option = FONT_OPTIONS.find((opt) => opt.id === id);
      if (!option) return;
      editor.chain().focus().setFontFamily(option.cssValue).run();
    },
    [editor],
  );

  const previewFamily =
    FONT_OPTIONS.find((opt) => opt.id === activeId)?.previewFamily ??
    'inherit';

  return (
    <Select value={activeId} onValueChange={onValueChange}>
      <SelectTrigger
        size="default"
        aria-label={t('actions.fontFamily')}
        className="w-[140px] gap-1.5 rounded-lg pl-2.5 pr-2 text-sm data-[size=default]:h-9"
      >
        <TypeIcon className="size-4 text-muted-foreground" />
        <SelectValue className="flex-1">
          <span style={{ fontFamily: previewFamily }}>
            {t(`font.options.${activeId}`)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[180px] p-1"
      >
        {FONT_OPTIONS.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
            className="h-9 gap-2 px-2 text-sm"
          >
            <span style={{ fontFamily: option.previewFamily }}>
              {t(`font.options.${option.id}`)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FontSizeSelect({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');

  const activeSize = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').fontSize as string | undefined) ??
      null,
  });

  const activeValue = activeSize ?? DEFAULT_FONT_SIZE;

  const onValueChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      editor.chain().focus().setFontSize(value).run();
    },
    [editor],
  );

  return (
    <Select value={activeValue} onValueChange={onValueChange}>
      <SelectTrigger
        size="default"
        aria-label={t('actions.fontSize')}
        className="w-[88px] gap-1.5 rounded-lg pl-2.5 pr-2 text-sm data-[size=default]:h-9"
      >
        <SelectValue className="flex-1" />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[110px] p-1"
      >
        {FONT_SIZES.map((size) => (
          <SelectItem key={size} value={size} className="h-9 gap-2 px-2 text-sm">
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
