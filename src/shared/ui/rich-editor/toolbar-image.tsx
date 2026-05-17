'use client';

import { CheckIcon, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

import type { RichEditorProps } from './rich-editor';

export function ImageButton({
  onImageInsert,
}: {
  onImageInsert: NonNullable<RichEditorProps['onImageInsert']>;
}) {
  const t = useTranslations('rich-editor');
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = src.trim();
    if (!trimmed) return;
    onImageInsert({ src: trimmed, alt: alt.trim() || undefined });
    setSrc('');
    setAlt('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.image')}
          />
        }
      >
        <ImageIcon />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('image.urlLabel')}
          </label>
          <TextInput
            type="url"
            autoFocus
            value={src}
            onChange={(event) => setSrc(event.target.value)}
            placeholder={t('image.urlPlaceholder')}
            className="h-9 text-sm"
          />
          <label className="text-xs font-medium text-muted-foreground">
            {t('image.altLabel')}
          </label>
          <TextInput
            type="text"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            className="h-9 text-sm"
          />
          <div className="flex items-center justify-end">
            <Button type="submit" size="sm" disabled={!src.trim()}>
              <CheckIcon /> {t('image.apply')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
