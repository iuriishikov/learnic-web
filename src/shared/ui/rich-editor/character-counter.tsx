'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';

export function CharacterCounter({
  editor,
  maxLength,
}: {
  editor: Editor;
  maxLength: number;
}) {
  const t = useTranslations('rich-editor');
  const length = useEditorState({
    editor,
    selector: ({ editor }) => editor.state.doc.textContent.length,
  });
  const remaining = Math.max(0, maxLength - length);

  return (
    <p
      className={cn(
        'pl-1 text-xs leading-none text-muted-foreground',
        remaining === 0 && 'text-destructive',
      )}
      aria-live="polite"
    >
      {t('characters.left', { count: remaining })}
    </p>
  );
}
