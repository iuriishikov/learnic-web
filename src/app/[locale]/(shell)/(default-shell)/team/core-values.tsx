import { getTranslations } from 'next-intl/server';

import { CoreValueItem, type CoreValueIconKey } from './core-value-item';

type ValueEntry = {
  icon: CoreValueIconKey;
  title: string;
  description: string;
};

export async function CoreValues() {
  const t = await getTranslations('team.values');
  const items = t.raw('items') as ValueEntry[];

  return (
    <section className="w-full bg-muted/50 py-16 md:py-24">
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

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
          {items.map((item, index) => (
            <CoreValueItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
