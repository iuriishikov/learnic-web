import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { UserAvatar } from '@/features/auth';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

import { LoadingDemo } from './loading-demo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.test.userAvatar',
    noindex: true,
  });
}

const SAMPLE_USERS = [
  { oid: 'a1', firstName: 'Анна', lastName: 'Иванова' },
  { oid: 'a2', firstName: 'Борис', lastName: 'Петров' },
  { oid: 'a3', firstName: 'Виктор', lastName: 'Сидоров' },
  { oid: 'a4', firstName: 'Галина', lastName: 'Кузнецова' },
  { oid: 'a5', firstName: 'Дмитрий', lastName: 'Смирнов' },
  { oid: 'a6', firstName: 'Елена', lastName: 'Волкова' },
  { oid: 'a7', firstName: 'Жанна', lastName: 'Соколова' },
  { oid: 'a8', firstName: 'Захар', lastName: 'Морозов' },
  { oid: 'a9', firstName: 'Ирина', lastName: 'Новикова' },
  { oid: 'a10', firstName: 'Кирилл', lastName: 'Фёдоров' },
];

const VALID_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=face';
const BROKEN_AVATAR =
  'https://example.invalid/this-image-definitely-does-not-exist.jpg';

export default async function TestUserAvatarPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-12 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          UserAvatar
        </h1>
        <p className="text-base text-muted-foreground">
          Демо состояний компонента: фон-инициалы (детерминированный цвет по
          oid), реальное изображение, ошибка загрузки, отсутствие пользователя.
        </p>
      </header>

      <Section title="Палитра по oid (10 пользователей × 3 размера)">
        <div className="space-y-6">
          {(['sm', 'default', 'lg'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-4">
              <span className="w-16 text-xs uppercase tracking-wider text-muted-foreground">
                {size}
              </span>
              {SAMPLE_USERS.map((u) => (
                <UserAvatar
                  key={u.oid}
                  user={{ ...u, avatarUrl: null }}
                  size={size}
                />
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="С реальным изображением">
        <div className="flex items-center gap-6">
          <UserAvatar
            user={{
              oid: 'real',
              firstName: 'Olivia',
              lastName: 'Rhye',
              avatarUrl: VALID_AVATAR,
            }}
            size="lg"
          />
          <p className="text-sm text-muted-foreground">
            Когда avatarUrl задан и грузится без ошибок — видно картинку.
          </p>
        </div>
      </Section>

      <Section title="Состояние загрузки (Skeleton)">
        <LoadingDemo />
      </Section>

      <Section title="Ошибка загрузки изображения (битый URL)">
        <div className="flex items-center gap-6">
          <UserAvatar
            user={{
              oid: 'broken',
              firstName: 'Phoenix',
              lastName: 'Baker',
              avatarUrl: BROKEN_AVATAR,
            }}
            size="lg"
          />
          <p className="text-sm text-muted-foreground">
            При сбое загрузки показываем инициалы поверх детерминированного фона
            и красный значок ошибки в углу — состояние отличимо от «у
            пользователя нет аватара».
          </p>
        </div>
      </Section>

      <Section title="Без пользователя (signed-out / loading)">
        <div className="flex items-center gap-6">
          <UserAvatar user={null} size="lg" />
          <p className="text-sm text-muted-foreground">
            Нейтральный muted-фон с «?», без цвета.
          </p>
        </div>
      </Section>

      <Section title="Онлайн-индикатор (зелёная точка)">
        <div className="flex flex-wrap items-center gap-6">
          {(['sm', 'default', 'lg'] as const).map((size) => (
            <div key={size} className="flex items-center gap-3">
              <UserAvatar
                user={{
                  oid: `online-${size}`,
                  firstName: 'Olivia',
                  lastName: 'Rhye',
                  avatarUrl: null,
                }}
                size={size}
                online
              />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {size}
              </span>
            </div>
          ))}
          <UserAvatar
            user={{
              oid: 'online-real',
              firstName: 'Olivia',
              lastName: 'Rhye',
              avatarUrl: VALID_AVATAR,
            }}
            size="lg"
            online
          />
          <p className="text-sm text-muted-foreground">
            Зелёная точка в правом нижнем углу — пользователь онлайн.
          </p>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}
