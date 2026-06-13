export const SITE_NAME = 'Learnic';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const THEME_SETTINGS = ['light', 'dark', 'system'] as const;

export type ThemeSetting = (typeof THEME_SETTINGS)[number];

function isThemeSetting(value: string | undefined): value is ThemeSetting {
  return THEME_SETTINGS.includes(value as ThemeSetting);
}

/**
 * Default UI theme applied on first visit, before the user picks one via the
 * in-app toggle. Read on the client (so it must be `NEXT_PUBLIC_*`) and passed
 * to `next-themes`' `defaultTheme` in the root layout. Falls back to `system`
 * — respect the OS `prefers-color-scheme` — when unset or invalid, which is
 * also the recommended value. Only set it to `light` / `dark` when you
 * deliberately want to force a theme on first paint.
 */
export const DEFAULT_THEME: ThemeSetting = isThemeSetting(
  process.env.NEXT_PUBLIC_DEFAULT_THEME,
)
  ? process.env.NEXT_PUBLIC_DEFAULT_THEME
  : 'system';

/**
 * Recipient address for the contact form. Read on the server and passed to
 * the help page, which builds a `mailto:` link the visitor's mail client
 * opens. Not a secret (it ships in the rendered page), but kept server-read
 * so the address lives in one place.
 */
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'hello@learnic.dev';

/**
 * URL of the product's Telegram channel. Read on the server and rendered
 * into the landing hero announcement chip. Not a secret (it ships in the
 * rendered page), but kept server-read so the address lives in one place.
 */
export const TELEGRAM_CHANNEL_URL =
  process.env.TELEGRAM_CHANNEL_URL ?? 'https://t.me/learnic_ru';

export const BRAND_COLOR = '#6C5CE7';

export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
