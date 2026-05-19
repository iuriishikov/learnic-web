'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import {
  ColorInput,
  ColorSwatchTrigger,
  solid,
  type ColorValue,
  type SolidValue,
} from '@/shared/ui/color-input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { useTagSearch } from '../api/use-tags';
import {
  PRODUCT_TAGS_MAX,
  TAG_NAME_MAX_LEN,
  type Tag,
} from '../model/types';
import { TagChip } from './tag-chip';

const DEFAULT_NEW_COLOR: SolidValue = solid('#6366F1');

type TagsFieldProps = {
  value: Tag[];
  onChange: (next: Tag[]) => void;
  readOnly?: boolean;
  disabledTitle?: string;
};

/**
 * Controlled tag picker. Hosts the chip list + "Add" popover with
 * search/create UI. Used by both the in-editor `TagsInput` (which
 * binds it to a server-backed mutation) and the create-product flow
 * (which keeps the picked tags in local state and applies them after
 * the product is created).
 */
export function TagsField({
  value,
  onChange,
  readOnly,
  disabledTitle,
}: TagsFieldProps) {
  const t = useTranslations('teach-products.editor.tags');
  const [open, setOpen] = useState(false);

  const atCap = value.length >= PRODUCT_TAGS_MAX;

  function handleAdd(tag: Tag) {
    if (atCap) return;
    if (value.some((existing) => existing.id === tag.id)) return;
    onChange([...value, tag]);
    setOpen(false);
  }

  function handleAddNew(name: string, color: string) {
    if (atCap) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const tempTag: Tag = {
      id: `__pending-${value.length}-${Date.now()}`,
      name: trimmed.slice(0, TAG_NAME_MAX_LEN),
      color,
    };
    onChange([...value, tempTag]);
    setOpen(false);
  }

  function handleRemove(tagId: string) {
    onChange(value.filter((tag) => tag.id !== tagId));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          removeLabel={t('removeAria', { name: tag.name })}
          onRemove={readOnly ? undefined : () => handleRemove(tag.id)}
        />
      ))}
      {!readOnly ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={atCap}
                title={atCap ? t('capReachedHint', { max: PRODUCT_TAGS_MAX }) : undefined}
              />
            }
          >
            <PlusIcon className="size-4" aria-hidden />
            {t('addCta')}
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0">
            <TagsPicker
              alreadyAttachedIds={new Set(value.map((tag) => tag.id))}
              onPickExisting={handleAdd}
              onCreateNew={handleAddNew}
            />
          </PopoverContent>
        </Popover>
      ) : null}
      {readOnly && value.length === 0 ? (
        <span className="text-sm text-muted-foreground" title={disabledTitle}>
          {t('empty')}
        </span>
      ) : null}
    </div>
  );
}

type TagsPickerProps = {
  alreadyAttachedIds: Set<string>;
  onPickExisting: (tag: Tag) => void;
  onCreateNew: (name: string, color: string) => void;
};

function TagsPicker({
  alreadyAttachedIds,
  onPickExisting,
  onCreateNew,
}: TagsPickerProps) {
  const t = useTranslations('teach-products.editor.tags');
  const [query, setQuery] = useState('');
  const [colorValue, setColorValue] = useState<ColorValue>(DEFAULT_NEW_COLOR);
  const trimmed = query.trim();
  // Idle state (no query) shouldn't fetch — the empty list signals
  // "type to search"; firing the request would surface the whole
  // tag pool and feel like a category browser instead of a
  // type-to-create combobox.
  const { data: results = [] } = useTagSearch(trimmed, trimmed.length > 0);
  // ``ColorInput`` is locked to ``solid`` mode below so the value
  // never coerces into gradient/image — but TypeScript still sees
  // the wider ``ColorValue`` union, so we narrow at the use site.
  const colorHex = colorValue.kind === 'solid' ? colorValue.hex : '#6366F1';

  const exactMatch = results.find(
    (tag) => tag.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreate = trimmed.length > 0 && !exactMatch;
  const isIdle = trimmed.length === 0;

  return (
    <Command shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('searchPlaceholder')}
        maxLength={TAG_NAME_MAX_LEN}
      />
      <CommandList>
        {isIdle ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('idleHint')}
          </div>
        ) : (
          <CommandEmpty>{t('searchEmpty')}</CommandEmpty>
        )}
        {showCreate ? (
          <CommandGroup heading={t('createHeading')}>
            <div
              className="flex items-center gap-2 px-2 py-1"
              onPointerMove={(event) => event.stopPropagation()}
            >
              <ColorInput
                value={colorValue}
                onValueChange={setColorValue}
                modes={['solid']}
              >
                <ColorSwatchTrigger
                  value={colorValue}
                  size="md"
                  ariaLabel={t('colorPickerLabel')}
                />
              </ColorInput>
              <CommandItem
                value={`__create-${trimmed}`}
                onSelect={() => onCreateNew(trimmed, colorHex)}
                className="flex-1"
              >
                <span className="truncate">
                  {t('createCta', { name: trimmed })}
                </span>
              </CommandItem>
            </div>
          </CommandGroup>
        ) : null}
        {results.length > 0 ? (
          <CommandGroup heading={t('existingHeading')}>
            {results.map((tag) => (
              <CommandItem
                key={tag.id}
                value={tag.id}
                disabled={alreadyAttachedIds.has(tag.id)}
                onSelect={() => onPickExisting(tag)}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}
