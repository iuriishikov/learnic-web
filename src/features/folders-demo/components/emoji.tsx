import { cn } from '@/shared/lib/utils';

import { emojiUrl, findEmoji } from '../lib/emoji-data';

type EmojiProps = {
  char: string;
  className?: string;
  alt?: string;
};

export function Emoji({ char, className, alt }: EmojiProps) {
  const entry = findEmoji(char);
  if (!entry) {
    return (
      <span
        aria-label={alt ?? char}
        className={cn('inline-block size-[1em] align-[-0.125em]', className)}
      >
        {char}
      </span>
    );
  }
  return (
    // Intentional <img>: 1em inline decoration. The shared `<Image>` primitive
    // adds a wrapper div + skeleton + error UI that all read wrong at this size,
    // and the natural fallback on load failure is the unicode glyph (handled by
    // the `!entry` branch above), not the generic image-off icon.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={emojiUrl(entry.image)}
      alt={alt ?? entry.name}
      className={cn('inline-block size-[1em] align-[-0.125em] select-none', className)}
      draggable={false}
      loading="lazy"
    />
  );
}
