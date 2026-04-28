import type { Metadata } from 'next';
import { getMessages } from 'next-intl/server';

import { SITE_NAME } from '@/shared/config/site';

const OG_LOCALES: Record<string, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

type PageMetadataOptions = {
  locale: string;
  namespace: string;
  noindex?: boolean;
  absoluteTitle?: boolean;
};

function readNamespace(messages: unknown, namespace: string) {
  const segments = namespace.split('.');
  let node: unknown = messages;
  for (const segment of segments) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

export async function buildPageMetadata({
  locale,
  namespace,
  noindex,
  absoluteTitle,
}: PageMetadataOptions): Promise<Metadata> {
  const messages = await getMessages({ locale });
  const node = readNamespace(messages, namespace);
  const title =
    typeof node === 'object' && node !== null && 'title' in node
      ? String((node as { title: unknown }).title)
      : SITE_NAME;
  const description =
    typeof node === 'object' && node !== null && 'description' in node
      ? String((node as { description: unknown }).description)
      : undefined;

  const openGraph: NonNullable<Metadata['openGraph']> = {
    type: 'website',
    siteName: SITE_NAME,
    locale: OG_LOCALES[locale] ?? OG_LOCALES.ru,
    title,
    images: ['/opengraph-image'],
  };
  const twitter: NonNullable<Metadata['twitter']> = {
    card: 'summary_large_image',
    title,
    images: ['/twitter-image'],
  };
  if (description) {
    openGraph.description = description;
    twitter.description = description;
  }

  return {
    title: absoluteTitle ? { absolute: title } : title,
    ...(description ? { description } : {}),
    openGraph,
    twitter,
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
