'use client';

import { KeyRoundIcon, MessagesSquareIcon, ShieldCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorContent, type ErrorResource } from '@/widgets/error-content';

export function Error403Client() {
  const t = useTranslations('error-403');

  const resources: ErrorResource[] = [
    {
      icon: ShieldCheckIcon,
      title: t('resources.documentation.title'),
      description: t('resources.documentation.description'),
      cta: t('resources.documentation.cta'),
      href: '#',
    },
    {
      icon: KeyRoundIcon,
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
