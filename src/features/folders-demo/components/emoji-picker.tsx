'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { TextInput } from '@/shared/ui/input-extended';

import {
  CATEGORY_ICONS,
  EMOJI_CATEGORIES,
  emojisByCategory,
  searchEmojis,
  type EmojiCategory,
  type EmojiEntry,
} from '../lib/emoji-data';

import { Emoji } from './emoji';

type EmojiPickerProps = {
  value: string;
  onSelect: (entry: EmojiEntry) => void;
  className?: string;
};

const CATEGORY_LABEL_KEYS: Record<EmojiCategory, string> = {
  'Smileys & Emotion': 'smileys',
  'People & Body': 'people',
  'Animals & Nature': 'animals',
  'Food & Drink': 'food',
  'Travel & Places': 'travel',
  'Activities': 'activities',
  'Objects': 'objects',
  'Symbols': 'symbols',
  'Flags': 'flags',
};

export function EmojiPicker({ value, onSelect, className }: EmojiPickerProps) {
  const t = useTranslations('folders-demo.emojiPicker');
  const tCat = useTranslations('folders-demo.emojiPicker.categories');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>(
    EMOJI_CATEGORIES[0],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<EmojiCategory, HTMLDivElement | null>>(
    new Map(),
  );
  const isProgrammaticScroll = useRef(false);

  const buckets = useMemo(() => emojisByCategory(), []);
  const searchResults = useMemo(() => searchEmojis(query), [query]);
  const isSearching = query.trim().length > 0;

  // Track which category section is most visible while user scrolls.
  useEffect(() => {
    if (isSearching) return;
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute(
              'data-category',
            ) as EmojiCategory | null;
            if (cat) setActiveCategory(cat);
          }
        }
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0.01 },
    );

    for (const node of sectionRefs.current.values()) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [isSearching]);

  const jumpToCategory = (category: EmojiCategory) => {
    const node = sectionRefs.current.get(category);
    if (!node || !scrollRef.current) return;
    setActiveCategory(category);
    isProgrammaticScroll.current = true;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  };

  return (
    <div
      className={cn(
        'flex w-[340px] flex-col overflow-hidden rounded-lg bg-popover',
        className,
      )}
    >
      <div className="px-2 pt-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 pl-8"
            aria-label={t('searchPlaceholder')}
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('clearSearch')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-1 max-h-72 min-h-72 overflow-y-auto overscroll-contain px-2 pb-1"
      >
        {isSearching ? (
          <Section
            title={t('searchResultsTitle')}
            entries={searchResults}
            value={value}
            onSelect={onSelect}
            empty={t('noResults')}
          />
        ) : (
          EMOJI_CATEGORIES.map((category) => (
            <div
              key={category}
              data-category={category}
              ref={(node) => {
                sectionRefs.current.set(category, node);
              }}
            >
              <Section
                title={tCat(CATEGORY_LABEL_KEYS[category])}
                entries={buckets[category]}
                value={value}
                onSelect={onSelect}
              />
            </div>
          ))
        )}
      </div>

      <div
        role="tablist"
        aria-label={t('categoryNav')}
        className="flex items-center justify-between gap-0.5 border-t border-border bg-popover px-1.5 py-1"
      >
        {EMOJI_CATEGORIES.map((category) => {
          const selected = !isSearching && activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={tCat(CATEGORY_LABEL_KEYS[category])}
              onClick={() => {
                if (isSearching) setQuery('');
                jumpToCategory(category);
              }}
              className={cn(
                'flex h-7 flex-1 items-center justify-center rounded-md transition-colors',
                selected ? 'bg-muted' : 'hover:bg-muted/60',
              )}
            >
              <Emoji char={CATEGORY_ICONS[category]} className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  title,
  entries,
  value,
  onSelect,
  empty,
}: {
  title: string;
  entries: EmojiEntry[];
  value: string;
  onSelect: (entry: EmojiEntry) => void;
  empty?: string;
}) {
  if (entries.length === 0 && empty) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        {empty}
      </div>
    );
  }
  if (entries.length === 0) return null;
  return (
    <div className="pt-1.5 pb-2">
      <p className="sticky top-0 -mt-1 bg-popover/95 py-1 pl-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
        {title}
      </p>
      <div className="grid grid-cols-8 gap-0.5">
        {entries.map((entry) => {
          const selected = entry.char === value;
          return (
            <button
              key={entry.unified}
              type="button"
              onClick={() => onSelect(entry)}
              aria-label={entry.name.toLowerCase()}
              aria-pressed={selected}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md transition-colors',
                selected
                  ? 'bg-brand/15 ring-1 ring-brand'
                  : 'hover:bg-muted',
              )}
            >
              <Emoji char={entry.char} className="size-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
