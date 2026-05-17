'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { CheckIcon, LinkIcon, UnlinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Toggle } from '@/shared/ui/toggle';

export function LinkButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const { isLinkActive, hasSelection } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isLinkActive: editor.isActive('link'),
      hasSelection:
        !editor.state.selection.empty || editor.isActive('link'),
    }),
  });

  const onOpenChange = (next: boolean) => {
    if (next) {
      const current = (editor.getAttributes('link').href as string) ?? '';
      setDraft(current);
    }
    setOpen(next);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const href = draft.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setOpen(false);
  };

  const onRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Toggle
            size="sm"
            aria-label={t('actions.link')}
            pressed={isLinkActive}
            disabled={!hasSelection && !isLinkActive}
            onPressedChange={() => onOpenChange(!open)}
          />
        }
      >
        <LinkIcon />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('link.urlLabel')}
          </label>
          <TextInput
            type="url"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('link.urlPlaceholder')}
            className="h-9 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            {isLinkActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <UnlinkIcon /> {t('link.remove')}
              </Button>
            ) : (
              <span aria-hidden />
            )}
            <Button type="submit" size="sm">
              <CheckIcon /> {t('link.apply')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
