import { getTranslations } from 'next-intl/server';

import { Separator } from '@/shared/ui/separator';

import { FeatureItem, type FeatureIconKey } from './feature-item';

type FeatureEntry = {
  icon: FeatureIconKey;
  title: string;
  description: string;
};

export async function FeaturesGrid() {
  const t = await getTranslations('home.features');
  const items = t.raw('items') as FeatureEntry[];

  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="mx-auto flex max-w-[768px] flex-col items-center text-center">
          <span className="text-sm font-semibold text-brand">
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[44px] lg:leading-[1.12]">
            {t('title')}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground md:mt-5 md:text-lg">
            {t('description')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
          {items.map((item, index) => (
            <FeatureItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              index={index}
            />
          ))}
        </div>

        <Separator className="mt-10 md:mt-14" />
      </div>
    </section>
  );
}
