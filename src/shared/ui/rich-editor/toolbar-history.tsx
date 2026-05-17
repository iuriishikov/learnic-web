'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';

export function HistoryButton({
  editor,
  direction,
  ariaLabel,
  icon,
}: {
  editor: Editor;
  direction: 'undo' | 'redo';
  ariaLabel: string;
  icon: ReactNode;
}) {
  const canRun = useEditorState({
    editor,
    selector: ({ editor }) =>
      direction === 'undo' ? editor.can().undo() : editor.can().redo(),
  });
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      disabled={!canRun}
      onClick={() => {
        const chain = editor.chain().focus();
        if (direction === 'undo') chain.undo().run();
        else chain.redo().run();
      }}
    >
      {icon}
    </Button>
  );
}
