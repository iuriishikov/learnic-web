'use client';

import { FolderPlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Textarea } from '@/shared/ui/textarea';

import { Emoji } from './emoji';
import { EmojiPicker } from './emoji-picker';

const DEFAULT_EMOJI = '📁';
const NAME_MAX = 80;
const DESCRIPTION_MAX = 200;

type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentName: string | null;
  onCreate: (input: {
    name: string;
    description: string;
    emoji: string;
  }) => void;
};

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentName,
  onCreate,
}: CreateFolderDialogProps) {
  const t = useTranslations('folders-demo.createDialog');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState<string>(DEFAULT_EMOJI);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('');
      setDescription('');
      setEmoji(DEFAULT_EMOJI);
      setPickerOpen(false);
    }
    onOpenChange(next);
  };

  const trimmedName = name.trim();
  const trimmedDesc = description.trim();
  const canCreate = trimmedName.length > 0 && trimmedName.length <= NAME_MAX;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    onCreate({
      name: trimmedName,
      description: trimmedDesc,
      emoji,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {parentName
              ? t('descriptionInside', { parent: parentName })
              : t('descriptionRoot')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <Label className="select-none">{t('emojiLabel')}</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      aria-label={t('emojiAriaLabel')}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    />
                  }
                >
                  <Emoji char={emoji} className="size-6" />
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  sideOffset={6}
                >
                  <EmojiPicker
                    value={emoji}
                    onSelect={(entry) => {
                      setEmoji(entry.char);
                      setPickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="folder-name">{t('nameLabel')}</Label>
              <Input
                id="folder-name"
                ref={inputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={NAME_MAX}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="folder-description">
                {t('descriptionLabel')}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {t('optional')}
                </span>
              </Label>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  description.length > DESCRIPTION_MAX * 0.9
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground',
                )}
              >
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(event) => {
                if (event.target.value.length <= DESCRIPTION_MAX) {
                  setDescription(event.target.value);
                }
              }}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              maxLength={DESCRIPTION_MAX}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!canCreate}>
              <FolderPlusIcon /> {t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
