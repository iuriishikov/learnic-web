import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { CodeBlockDemoClient } from './code-block-demo-client';

export const metadata: Metadata = {
  title: 'CodeBlock',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CodeBlockDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CodeBlockDemoClient />;
}
