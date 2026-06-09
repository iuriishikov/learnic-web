export const SITE_NAME = 'Learnic';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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
