import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

type CatchAllPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
