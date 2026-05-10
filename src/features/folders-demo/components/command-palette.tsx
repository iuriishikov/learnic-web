'use client';

import {
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
  GraduationCapIcon,
  HomeIcon,
  RadioIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Kbd } from '@/shared/ui/kbd';

import { flatFolderOptions, pathToFolder } from '../lib/folder-tree';
import type { DemoState } from '../model/types';

import { Emoji } from './emoji';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DemoState;
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onReset: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  state,
  currentFolderId,
  onNavigate,
  onCreateFolder,
  onReset,
}: CommandPaletteProps) {
  const t = useTranslations('folders-demo.palette');
  const folderOptions = flatFolderOptions(state);

  const handle = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder={t('placeholder')} />
          <CommandList>
            <CommandEmpty>{t('empty')}</CommandEmpty>

            <CommandGroup heading={t('actions')}>
              <CommandItem
                value="create folder создать папку"
                onSelect={handle(onCreateFolder)}
              >
                <FolderPlusIcon />
                <span>{t('createFolder')}</span>
                <CommandShortcut className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>N</Kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                value="reset demo сбросить"
                onSelect={handle(onReset)}
              >
                <RotateCcwIcon />
                <span>{t('reset')}</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t('folders')}>
              {currentFolderId !== null ? (
                <CommandItem
                  value="root home корень все продукты"
                  onSelect={handle(() => onNavigate(null))}
                >
                  <HomeIcon />
                  <span>{t('goRoot')}</span>
                </CommandItem>
              ) : null}
              {folderOptions.map((option) => {
                const folder = state.folders.find((f) => f.id === option.id);
                if (!folder) return null;
                const path = pathToFolder(state, folder.id)
                  .map((s) => s.name)
                  .join(' › ');
                return (
                  <CommandItem
                    key={folder.id}
                    value={`${folder.id} ${option.label} ${folder.description}`}
                    onSelect={handle(() => onNavigate(folder.id))}
                    disabled={folder.id === currentFolderId}
                  >
                    {folder.emoji ? (
                      <Emoji char={folder.emoji} className="size-4" />
                    ) : (
                      <FolderIcon />
                    )}
                    <span style={{ paddingLeft: option.depth * 8 }}>
                      {path}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t('products')}>
              {state.products.map((product) => {
                const folderName = product.folderId
                  ? pathToFolder(state, product.folderId)
                      .map((s) => s.name)
                      .join(' › ')
                  : t('rootLabel');
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.id} ${product.title} ${product.description}`}
                    onSelect={handle(() => onNavigate(product.folderId))}
                  >
                    {product.type === 'course' ? (
                      <GraduationCapIcon />
                    ) : (
                      <RadioIcon />
                    )}
                    <span className="truncate">{product.title}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronRightIcon className="size-3" />
                      {folderName}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
