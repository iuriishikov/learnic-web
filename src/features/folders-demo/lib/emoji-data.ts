import emojiSource from 'emoji-datasource-apple/emoji.json';

const PACKAGE_VERSION = '16.0.0';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@${PACKAGE_VERSION}/img/apple/64`;

export type EmojiEntry = {
  unified: string;
  char: string;
  image: string;
  name: string;
  shortName: string;
  category: EmojiCategory;
  subcategory: string;
  keywords: string[];
  sortOrder: number;
};

export const EMOJI_CATEGORIES = [
  'Smileys & Emotion',
  'People & Body',
  'Animals & Nature',
  'Food & Drink',
  'Travel & Places',
  'Activities',
  'Objects',
  'Symbols',
  'Flags',
] as const;

export type EmojiCategory = (typeof EMOJI_CATEGORIES)[number];

type RawEmojiRecord = {
  name: string;
  unified: string;
  non_qualified: string | null;
  image: string;
  short_name: string;
  short_names: string[];
  category: string;
  subcategory: string;
  sort_order: number;
  has_img_apple: boolean;
};

function unifiedToChar(unified: string): string {
  const codePoints = unified
    .split('-')
    .map((part) => parseInt(part, 16))
    .filter((cp) => Number.isFinite(cp));
  if (codePoints.length === 0) return '';
  return String.fromCodePoint(...codePoints);
}

function buildEntries(): EmojiEntry[] {
  const list: EmojiEntry[] = [];
  const records = emojiSource as RawEmojiRecord[];
  for (const item of records) {
    if (!item.has_img_apple) continue;
    if (!EMOJI_CATEGORIES.includes(item.category as EmojiCategory)) continue;
    const char = unifiedToChar(item.unified);
    if (!char) continue;
    list.push({
      unified: item.unified,
      char,
      image: item.image,
      name: item.name,
      shortName: item.short_name,
      category: item.category as EmojiCategory,
      subcategory: item.subcategory,
      keywords: item.short_names ?? [],
      sortOrder: item.sort_order,
    });
  }
  list.sort((a, b) => a.sortOrder - b.sortOrder);
  return list;
}

const ENTRIES = buildEntries();

const BY_CHAR = new Map<string, EmojiEntry>();
for (const entry of ENTRIES) {
  BY_CHAR.set(entry.char, entry);
}
// Fallback aliases — register variant-selector-stripped form too so partial inputs match.
for (const entry of ENTRIES) {
  const stripped = [...entry.char].filter((c) => c.codePointAt(0) !== 0xfe0f).join('');
  if (stripped && !BY_CHAR.has(stripped)) BY_CHAR.set(stripped, entry);
}

export function findEmoji(char: string): EmojiEntry | undefined {
  if (!char) return undefined;
  return BY_CHAR.get(char) ?? BY_CHAR.get([...char][0] ?? '');
}

export function emojiUrl(image: string): string {
  return `${CDN_BASE}/${image}`;
}

export function emojisByCategory(): Record<EmojiCategory, EmojiEntry[]> {
  const buckets = Object.fromEntries(
    EMOJI_CATEGORIES.map((c) => [c, [] as EmojiEntry[]]),
  ) as Record<EmojiCategory, EmojiEntry[]>;
  for (const entry of ENTRIES) {
    buckets[entry.category].push(entry);
  }
  return buckets;
}

export function searchEmojis(query: string, limit = 120): EmojiEntry[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  const matches: EmojiEntry[] = [];
  for (const entry of ENTRIES) {
    const haystack =
      entry.name.toLocaleLowerCase() +
      ' ' +
      entry.shortName +
      ' ' +
      entry.keywords.join(' ');
    if (haystack.includes(q)) {
      matches.push(entry);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

export const CATEGORY_ICONS: Record<EmojiCategory, string> = {
  'Smileys & Emotion': '😀',
  'People & Body': '👤',
  'Animals & Nature': '🐶',
  'Food & Drink': '🍔',
  'Travel & Places': '✈️',
  'Activities': '⚽',
  'Objects': '💡',
  'Symbols': '❤️',
  'Flags': '🚩',
};
