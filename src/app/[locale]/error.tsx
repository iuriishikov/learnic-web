'use client';

import { ActivityIcon, BookOpenIcon, MessagesSquareIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { ErrorContent, type ErrorResource } from '@/widgets/error-content';
import { SiteHeader } from '@/widgets/site-header';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleErrorPage({ error }: ErrorPageProps) {
  const t = useTranslations('error-500');

  useEffect(() => {
    console.error(error);
  }, [error]);

  const resources: ErrorResource[] = [
    {
      icon: ActivityIcon,
      title: t('resources.documentation.title'),
      description: t('resources.documentation.description'),
      cta: t('resources.documentation.cta'),
      href: '#',
    },
    {
      icon: BookOpenIcon,
      title: t('resources.blog.title'),
      description: t('resources.blog.description'),
      cta: t('resources.blog.cta'),
      href: '#',
    },
    {
      icon: MessagesSquareIcon,
      title: t('resources.chat.title'),
      description: t('resources.chat.description'),
      cta: t('resources.chat.cta'),
      href: '#',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ErrorContent
          label={t('label')}
          title={t('title')}
          description={t('description')}
          goBackLabel={t('actions.goBack')}
          goHomeLabel={t('actions.goHome')}
          resources={resources}
        />
      </main>
    </div>
  );
}
