'use client';

import {
  ActivityIcon,
  MessagesSquareIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorContent, type ErrorResource } from '@/widgets/error-content';

export function Error503Client() {
  const t = useTranslations('error-503');

  const resources: ErrorResource[] = [
    {
      icon: ActivityIcon,
      title: t('resources.documentation.title'),
      description: t('resources.documentation.description'),
      cta: t('resources.documentation.cta'),
      href: '#',
    },
    {
      icon: RadioTowerIcon,
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
    <ErrorContent
      label={t('label')}
      title={t('title')}
      description={t('description')}
      goBackLabel={t('actions.goBack')}
      goHomeLabel={t('actions.goHome')}
      resources={resources}
    />
  );
}
