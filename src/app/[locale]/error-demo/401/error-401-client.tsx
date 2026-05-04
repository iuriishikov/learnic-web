'use client';

import { KeyRoundIcon, LogInIcon, UserPlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorContent, type ErrorResource } from '@/widgets/error-content';

export function Error401Client() {
  const t = useTranslations('error-401');

  const resources: ErrorResource[] = [
    {
      icon: LogInIcon,
      title: t('resources.documentation.title'),
      description: t('resources.documentation.description'),
      cta: t('resources.documentation.cta'),
      href: '/login',
    },
    {
      icon: UserPlusIcon,
      title: t('resources.blog.title'),
      description: t('resources.blog.description'),
      cta: t('resources.blog.cta'),
      href: '/register',
    },
    {
      icon: KeyRoundIcon,
      title: t('resources.chat.title'),
      description: t('resources.chat.description'),
      cta: t('resources.chat.cta'),
      href: '/forgot-password',
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
