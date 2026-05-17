'use client';

import type { Editor } from '@tiptap/react';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  RedoIcon,
  SparklesIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';

import type { RichEditorProps } from './rich-editor';
import { ColorButton, HighlightButton } from './toolbar-color';
import { FontFamilySelect, FontSizeSelect } from './toolbar-fonts';
import { AlignToggle, FormatToggle } from './toolbar-format';
import { HistoryButton } from './toolbar-history';
import { ImageButton } from './toolbar-image';
import { LinkButton } from './toolbar-link';
import {
  BlockquoteToggle,
  BulletListToggle,
  OrderedListToggle,
} from './toolbar-lists';

export function Toolbar({
  editor,
  onImageInsert,
  onAiAction,
}: {
  editor: Editor;
  onImageInsert?: RichEditorProps['onImageInsert'];
  onAiAction?: RichEditorProps['onAiAction'];
}) {
  const t = useTranslations('rich-editor');

  return (
    <div className="flex flex-nowrap items-center gap-1 overflow-x-auto px-2 py-2 [&>*]:shrink-0">
      <FontFamilySelect editor={editor} />
      <FontSizeSelect editor={editor} />

      <ToolbarSeparator />

      <ToolbarGroup>
        <FormatToggle
          editor={editor}
          mark="bold"
          ariaLabel={t('actions.bold')}
          icon={<BoldIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="italic"
          ariaLabel={t('actions.italic')}
          icon={<ItalicIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="underline"
          ariaLabel={t('actions.underline')}
          icon={<UnderlineIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="strike"
          ariaLabel={t('actions.strike')}
          icon={<StrikethroughIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="code"
          ariaLabel={t('actions.code')}
          icon={<CodeIcon />}
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <ColorButton editor={editor} />
        <HighlightButton editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <AlignToggle
          editor={editor}
          align="left"
          ariaLabel={t('actions.alignLeft')}
          icon={<AlignLeftIcon />}
        />
        <AlignToggle
          editor={editor}
          align="center"
          ariaLabel={t('actions.alignCenter')}
          icon={<AlignCenterIcon />}
        />
        <AlignToggle
          editor={editor}
          align="right"
          ariaLabel={t('actions.alignRight')}
          icon={<AlignRightIcon />}
        />
        <AlignToggle
          editor={editor}
          align="justify"
          ariaLabel={t('actions.alignJustify')}
          icon={<AlignJustifyIcon />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <BulletListToggle editor={editor} />
        <OrderedListToggle editor={editor} />
        <BlockquoteToggle editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <LinkButton editor={editor} />
      {onImageInsert ? <ImageButton onImageInsert={onImageInsert} /> : null}

      <ToolbarSeparator />

      <ToolbarGroup>
        <HistoryButton
          editor={editor}
          direction="undo"
          ariaLabel={t('actions.undo')}
          icon={<UndoIcon />}
        />
        <HistoryButton
          editor={editor}
          direction="redo"
          ariaLabel={t('actions.redo')}
          icon={<RedoIcon />}
        />
      </ToolbarGroup>

      {onAiAction ? (
        <>
          <ToolbarSeparator />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.ai')}
            onClick={() => onAiAction(editor)}
          >
            <SparklesIcon />
          </Button>
        </>
      ) : null}
    </div>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarSeparator() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}
