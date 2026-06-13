import { getTranslations } from 'next-intl/server';

import { TeamMemberItem } from './team-member-item';

type MemberEntry = {
  name: string;
  role: string;
};

const MEMBER_PHOTOS: ReadonlyArray<string> = ['/team/yuri-shikov.jpg'];

export async function TeamMembers() {
  const t = await getTranslations('team.members');
  const items = t.raw('items') as MemberEntry[];

  return (
    <section className="w-full pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="mx-auto flex max-w-[768px] flex-col items-center text-center">
          <span className="text-sm font-semibold text-brand">
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground md:mt-5 md:text-xl">
            {t('description')}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-12 md:mt-16">
          {items.map((item, index) => (
            <TeamMemberItem
              key={item.name}
              name={item.name}
              role={item.role}
              imageUrl={MEMBER_PHOTOS[index]}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
