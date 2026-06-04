'use client';

import { useTranslations } from 'next-intl';

import { UserAvatar } from '@/shared/ui/user-avatar';

import type { TopTeacher } from '../model/types';

type TopTeachersProps = {
  teachers: TopTeacher[];
};

export function TopTeachers({ teachers }: TopTeachersProps) {
  const t = useTranslations('admin-dashboard');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-foreground">
        {t('topTeachers.title')}
      </h2>
      {teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('topTeachers.empty')}</p>
      ) : (
        <ul className="flex flex-col">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="flex items-center gap-3 py-2.5">
              <UserAvatar
                user={{ id: teacher.id, fullName: teacher.name, avatar: null }}
                imageUrl={teacher.avatarUrl}
                shape="circle"
                statusType={null}
                showLoadErrorIndicator={false}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {teacher.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t('topTeachers.metrics', {
                    students: teacher.studentCount,
                    products: teacher.productCount,
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
