'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { ListIcon, ListOrderedIcon, QuoteIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Toggle } from '@/shared/ui/toggle';

export function BulletListToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('bulletList'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.bulletList')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
    >
      <ListIcon />
    </Toggle>
  );
}

export function OrderedListToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('orderedList'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.orderedList')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
    >
      <ListOrderedIcon />
    </Toggle>
  );
}

export function BlockquoteToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('blockquote'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.blockquote')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
    >
      <QuoteIcon />
    </Toggle>
  );
}
