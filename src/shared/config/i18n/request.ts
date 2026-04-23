import fs from 'node:fs';
import path from 'node:path';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const MESSAGES_DIR = path.join(
  process.cwd(),
  'src/shared/config/i18n/messages',
);

function loadMessages(locale: string): Record<string, unknown> {
  const dir = path.join(MESSAGES_DIR, locale);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  const merged: Record<string, unknown> = {};
  for (const file of files) {
    const namespace = path.basename(file, '.json');
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    merged[namespace] = JSON.parse(raw);
  }
  return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
  };
});
