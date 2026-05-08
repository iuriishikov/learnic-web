'use client';

import {
  ActivityIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  KeyRoundIcon,
  LogInIcon,
  MessagesSquareIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorContent, type ErrorResource } from './error-content';

export type SupportedErrorStatus = 400 | 401 | 403 | 500 | 503;

type StatusConfig = {
  namespace: `error-${SupportedErrorStatus}`;
  resources: [
    { icon: LucideIcon; href: string },
    { icon: LucideIcon; href: string },
    { icon: LucideIcon; href: string },
  ];
};

const STATUS_CONFIG: Record<SupportedErrorStatus, StatusConfig> = {
  400: {
    namespace: 'error-400',
    resources: [
      { icon: AlertTriangleIcon, href: '#' },
      { icon: BookOpenIcon, href: '#' },
      { icon: MessagesSquareIcon, href: '#' },
    ],
  },
  401: {
    namespace: 'error-401',
    resources: [
      { icon: LogInIcon, href: '/login' },
      { icon: UserPlusIcon, href: '/register' },
      { icon: KeyRoundIcon, href: '/forgot-password' },
    ],
  },
  403: {
    namespace: 'error-403',
    resources: [
      { icon: ShieldCheckIcon, href: '#' },
      { icon: KeyRoundIcon, href: '#' },
      { icon: MessagesSquareIcon, href: '#' },
    ],
  },
  500: {
    namespace: 'error-500',
    resources: [
      { icon: ActivityIcon, href: '#' },
      { icon: BookOpenIcon, href: '#' },
      { icon: MessagesSquareIcon, href: '#' },
    ],
  },
  503: {
    namespace: 'error-503',
    resources: [
      { icon: ActivityIcon, href: '#' },
      { icon: RadioTowerIcon, href: '#' },
      { icon: MessagesSquareIcon, href: '#' },
    ],
  },
};

export function resolveSupportedStatus(
  status: number | null,
): SupportedErrorStatus {
  if (status !== null && status in STATUS_CONFIG) {
    return status as SupportedErrorStatus;
  }
  return 500;
}

type StatusErrorContentProps = {
  status: SupportedErrorStatus;
};

export function StatusErrorContent({ status }: StatusErrorContentProps) {
  const config = STATUS_CONFIG[status];
  const t = useTranslations(config.namespace);

  const resources: ErrorResource[] = [
    {
      icon: config.resources[0].icon,
      title: t('resources.documentation.title'),
      description: t('resources.documentation.description'),
      cta: t('resources.documentation.cta'),
      href: config.resources[0].href,
    },
    {
      icon: config.resources[1].icon,
      title: t('resources.blog.title'),
      description: t('resources.blog.description'),
      cta: t('resources.blog.cta'),
      href: config.resources[1].href,
    },
    {
      icon: config.resources[2].icon,
      title: t('resources.chat.title'),
      description: t('resources.chat.description'),
      cta: t('resources.chat.cta'),
      href: config.resources[2].href,
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
