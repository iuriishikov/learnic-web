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
    // eslint-disable-next-line @next/next/no-img-element -- third-party Apple emoji asset
    <img
      src={emojiUrl(entry.image)}
      alt={alt ?? entry.name}
      className={cn('inline-block size-[1em] align-[-0.125em] select-none', className)}
      draggable={false}
      loading="lazy"
    />
  );
}
