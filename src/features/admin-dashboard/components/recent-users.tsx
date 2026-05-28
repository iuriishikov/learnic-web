'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { UserAvatar } from '@/shared/ui/user-avatar';

import { RECENT_USERS } from '../model/mock-data';

export function RecentUsers() {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-foreground">
        {t('recentUsers.title')}
      </h2>
      <ul className="flex flex-col">
        {RECENT_USERS.map((user) => (
          <li key={user.id} className="flex items-center gap-3 py-2.5">
            <UserAvatar
              user={{ id: user.id, fullName: user.name, avatar: null }}
              imageUrl={user.avatarUrl}
              shape="circle"
              statusType={null}
              halo={false}
              showLoadErrorIndicator={false}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {t('recentUsers.joinedAt', {
                  date: format.dateTime(new Date(user.joinedAt), {
                    month: 'short',
                    year: 'numeric',
                  }),
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
