'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import type { ReactNode } from 'react';

import { Toggle } from '@/shared/ui/toggle';

import { INVERSE_TOGGLE_CLASS, type Mark } from './constants';

// Bold / italic / underline / strike / code marker toggles.
// Variant "inverse" swaps colours so it reads on the bubble-menu overlay.
export function FormatToggle({
  editor,
  mark,
  ariaLabel,
  icon,
  variant = 'default',
}: {
  editor: Editor;
  mark: Mark;
  ariaLabel: string;
  icon: ReactNode;
  variant?: 'default' | 'inverse';
}) {
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive(mark),
  });

  return (
    <Toggle
      size="sm"
      aria-label={ariaLabel}
      pressed={isActive}
      onPressedChange={() => {
        const chain = editor.chain().focus();
        if (mark === 'bold') chain.toggleBold().run();
        else if (mark === 'italic') chain.toggleItalic().run();
        else if (mark === 'underline') chain.toggleUnderline().run();
        else if (mark === 'strike') chain.toggleStrike().run();
        else chain.toggleCode().run();
      }}
      className={variant === 'inverse' ? INVERSE_TOGGLE_CLASS : undefined}
    >
      {icon}
    </Toggle>
  );
}

// Text-align toggle (left/center/right/justify). Mirrors FormatToggle's
// variant scheme for use inside the bubble menu.
export function AlignToggle({
  editor,
  align,
  ariaLabel,
  icon,
  variant = 'default',
}: {
  editor: Editor;
  align: 'left' | 'center' | 'right' | 'justify';
  ariaLabel: string;
  icon: ReactNode;
  variant?: 'default' | 'inverse';
}) {
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive({ textAlign: align }),
  });

  return (
    <Toggle
      size="sm"
      aria-label={ariaLabel}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().setTextAlign(align).run()}
      className={variant === 'inverse' ? INVERSE_TOGGLE_CLASS : undefined}
    >
      {icon}
    </Toggle>
  );
}
