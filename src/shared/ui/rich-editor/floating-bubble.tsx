'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  BoldIcon,
  CheckIcon,
  ItalicIcon,
  LinkIcon,
  UnderlineIcon,
  UnlinkIcon,
  XIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useCallback, useState } from 'react';

import { TextInput } from '@/shared/ui/input-extended';
import { Toggle } from '@/shared/ui/toggle';

import { INVERSE_TOGGLE_CLASS } from './constants';
import { AlignToggle, FormatToggle } from './toolbar-format';

// Floating "selection toolbar" that appears above the current
// selection. Two modes: format (toggles + alignment + link button)
// and link (URL input + apply / remove / cancel).
export function FloatingBubbleMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const [linkMode, setLinkMode] = useState(false);
  const [draft, setDraft] = useState('');

  const isLinkActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('link'),
  });

  const enterLinkMode = useCallback(() => {
    const current = (editor.getAttributes('link').href as string) ?? '';
    setDraft(current);
    setLinkMode(true);
  }, [editor]);

  const exitLinkMode = useCallback(() => {
    setLinkMode(false);
    setDraft('');
  }, []);

  const submitLink = useCallback(() => {
    const href = draft.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    exitLinkMode();
  }, [editor, draft, exitLinkMode]);

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    exitLinkMode();
  }, [editor, exitLinkMode]);

  const onLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitLink();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      exitLinkMode();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: 8,
        onHide: () => setLinkMode(false),
      }}
      shouldShow={({ editor: e, state }) => {
        if (!e.isEditable) return false;
        const { selection } = state;
        if (selection.empty) return false;
        if (e.isActive('codeBlock')) return false;
        return true;
      }}
    >
      {/* The bubble menu renders in a portal at <body>, so focus moving
          here would otherwise leave the data-cursor-target ancestor
          chain and trip the cursors-presence "leave" handler. Marking
          the wrapper as keepalive tells the provider to treat this as
          still being on the parent field. */}
      <div data-cursor-keepalive="rich-editor.bubble-menu" className="contents">
      <AnimatePresence mode="wait" initial={false}>
        {linkMode ? (
          <motion.div
            key="link"
            data-rich-editor-portal=""
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-1 rounded-lg bg-editor-overlay p-1 text-editor-overlay-foreground shadow-lg ring-1 ring-editor-overlay/30"
          >
            <TextInput
              type="url"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onLinkKeyDown}
              placeholder={t('link.urlPlaceholder')}
              aria-label={t('link.urlLabel')}
              className="h-7 w-56 border-transparent bg-editor-overlay-foreground/10 text-xs text-editor-overlay-foreground placeholder:text-editor-overlay-foreground/50 focus-visible:border-editor-overlay-foreground/30 focus-visible:ring-editor-overlay-foreground/20"
            />
            {isLinkActive ? (
              <button
                type="button"
                onClick={removeLink}
                aria-label={t('link.remove')}
                className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
              >
                <UnlinkIcon className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={submitLink}
              aria-label={t('link.apply')}
              className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={exitLinkMode}
              aria-label={t('link.cancel')}
              className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="format"
            data-rich-editor-portal=""
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-0.5 rounded-lg bg-editor-overlay p-1 text-editor-overlay-foreground shadow-lg ring-1 ring-editor-overlay/30"
          >
            <FormatToggle
              editor={editor}
              mark="bold"
              ariaLabel={t('actions.bold')}
              icon={<BoldIcon />}
              variant="inverse"
            />
            <FormatToggle
              editor={editor}
              mark="italic"
              ariaLabel={t('actions.italic')}
              icon={<ItalicIcon />}
              variant="inverse"
            />
            <FormatToggle
              editor={editor}
              mark="underline"
              ariaLabel={t('actions.underline')}
              icon={<UnderlineIcon />}
              variant="inverse"
            />
            <span
              aria-hidden
              className="mx-0.5 h-4 w-px bg-editor-overlay-foreground/20"
            />
            <AlignToggle
              editor={editor}
              align="left"
              ariaLabel={t('actions.alignLeft')}
              icon={<AlignLeftIcon />}
              variant="inverse"
            />
            <AlignToggle
              editor={editor}
              align="center"
              ariaLabel={t('actions.alignCenter')}
              icon={<AlignCenterIcon />}
              variant="inverse"
            />
            <span
              aria-hidden
              className="mx-0.5 h-4 w-px bg-editor-overlay-foreground/20"
            />
            <Toggle
              size="sm"
              aria-label={t('actions.link')}
              pressed={isLinkActive}
              onPressedChange={enterLinkMode}
              className={INVERSE_TOGGLE_CLASS}
            >
              <LinkIcon />
            </Toggle>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </BubbleMenu>
  );
}
