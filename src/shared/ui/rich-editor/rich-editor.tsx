'use client';

import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { BackgroundColor } from '@tiptap/extension-text-style/background-color';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import {
  EditorContent,
  type Editor,
  useEditor,
} from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { cn } from '@/shared/lib/utils';

import { CharacterCounter } from './character-counter';
import { FloatingBubbleMenu } from './floating-bubble';
import { Toolbar } from './toolbar';

export type RichEditorProps = {
  defaultValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  editorClassName?: string;
  autoFocus?: boolean | 'start' | 'end' | 'all' | number;
  onReady?: (editor: Editor) => void;
  /**
   * Render the tiptap editor synchronously on first render. Defaults to false
   * so SSR-rendered consumers don't hit hydration mismatches; pass true from
   * client-only call sites (e.g. inside an interactive popover) to skip the
   * placeholder→editor swap that otherwise causes a visible height jump.
   */
  immediatelyRender?: boolean;
  /**
   * When set, renders a "X characters left" counter below the editor and stops
   * accepting input once the plain-text length reaches the limit.
   */
  maxLength?: number;
  /** When provided, renders an Image button that opens a URL prompt. */
  onImageInsert?: (payload: { src: string; alt?: string }) => void;
  /** When provided, renders a sparkles AI button that fires this callback. */
  onAiAction?: (editor: Editor) => void;
};

export function RichEditor({
  defaultValue,
  onChange,
  placeholder,
  editable = true,
  className,
  editorClassName,
  autoFocus = false,
  onReady,
  immediatelyRender = false,
  maxLength,
  onImageInsert,
  onAiAction,
}: RichEditorProps) {
  const t = useTranslations('rich-editor');

  const editor = useEditor({
    immediatelyRender,
    editable,
    autofocus: autoFocus,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? t('placeholder') }),
    ],
    content: defaultValue ?? '',
    editorProps: {
      attributes: {
        class: cn(
          'rich-editor-content min-h-[180px] w-full px-4 py-4 text-sm leading-relaxed text-foreground focus:outline-none',
          editorClassName,
        ),
      },
      handleKeyDown(view, event) {
        if (
          maxLength === undefined ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return false;
        const isContentKey = event.key.length === 1 || event.key === 'Enter';
        if (!isContentKey) return false;
        const { state } = view;
        const remaining =
          maxLength -
          state.doc.textContent.length +
          (state.selection.to - state.selection.from);
        if (remaining > 0) return false;
        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-xl border border-input bg-background',
          className,
        )}
      >
        <div className="h-12 border-b border-border" />
        <div className="min-h-[180px] px-4 py-4" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-input bg-background transition-shadow',
          editable &&
            'focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/40',
        )}
      >
        {editable ? (
          <>
            <Toolbar
              editor={editor}
              onImageInsert={onImageInsert}
              onAiAction={onAiAction}
            />
            <div className="border-t border-border" />
          </>
        ) : null}
        <EditorContent editor={editor} />
        {editable ? <FloatingBubbleMenu editor={editor} /> : null}
      </div>
      {maxLength !== undefined ? (
        <CharacterCounter editor={editor} maxLength={maxLength} />
      ) : null}
    </div>
  );
}
