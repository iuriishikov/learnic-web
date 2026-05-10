'use client';

import { FolderIcon, HomeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { descendantIds, flatFolderOptions } from '../lib/folder-tree';
import type { DemoState } from '../model/types';

type MoveToDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DemoState;
  /** if moving a folder, exclude itself + descendants from options */
  excludeFolderId?: string | null;
  currentFolderId: string | null;
  onSelect: (targetFolderId: string | null) => void;
};

export function MoveToDialog({
  open,
  onOpenChange,
  state,
  excludeFolderId,
  currentFolderId,
  onSelect,
}: MoveToDialogProps) {
  const t = useTranslations('folders-demo');
  const options = flatFolderOptions(state);
  const excluded = excludeFolderId
    ? descendantIds(state, excludeFolderId)
    : new Set<string>();

  const visible = options.filter((opt) => !excluded.has(opt.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('moveToDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('moveToDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder={t('moveToDialog.placeholder')} />
          <CommandList>
            <CommandEmpty>{t('moveToDialog.empty')}</CommandEmpty>
            {currentFolderId !== null ? (
              <CommandGroup heading={t('moveToDialog.suggested')}>
                <CommandItem
                  value="root all-products корень"
                  onSelect={() => {
                    onSelect(null);
                    onOpenChange(false);
                  }}
                >
                  <HomeIcon />
                  <span>{t('breadcrumb.allProducts')}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup heading={t('moveToDialog.folders')}>
              {visible.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.id} ${option.label}`}
                  onSelect={() => {
                    onSelect(option.id);
                    onOpenChange(false);
                  }}
                  disabled={option.id === currentFolderId}
                >
                  <FolderIcon />
                  <span style={{ paddingLeft: option.depth * 12 }}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
