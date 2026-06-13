import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/config/i18n/navigation';
import { TELEGRAM_CHANNEL_URL } from '@/shared/config/site';
import { Button } from '@/shared/ui/button';
import { GridBackdrop } from '@/shared/ui/grid-backdrop';
import { Separator } from '@/shared/ui/separator';

import { DeviceShowcase } from './device-showcase';
import { DEMO_SECTION_ID, HeroDemoButton } from './hero-demo-button';
import { TypewriterTitle } from './typewriter-title';

export async function LandingHero() {
  const t = await getTranslations('home.hero');

  return (
    <section className="relative isolate -mt-20 w-full overflow-hidden md:-mt-24">
      <div className="relative mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="relative pt-40 pb-20 md:pt-52 md:pb-28">
          <GridBackdrop
            className="-inset-x-8 -bottom-20 md:-inset-x-16 md:-bottom-28 lg:-inset-x-32 xl:-inset-x-48"
            announcement={{
              badge: t('featureBadge'),
              linkText: t('featureLinkText'),
              href: TELEGRAM_CHANNEL_URL,
              external: true,
            }}
          />

          <div className="relative mt-14 flex flex-col items-center text-center md:mt-16">
            <TypewriterTitle
              text={t('title')}
              className="max-w-[860px] text-pretty text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground md:text-6xl lg:text-[72px]"
            />

            <p className="mt-5 max-w-[640px] text-pretty text-base leading-[1.55] text-muted-foreground md:mt-6 md:text-lg">
              {t('description')}
            </p>

            <div className="mt-8 flex w-full flex-col-reverse gap-3 md:mt-10 md:w-auto md:flex-row md:justify-center md:gap-3">
              <HeroDemoButton label={t('demo')} />
              <Button
                className="h-12 w-full gap-2 rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90 md:w-auto md:min-w-[120px]"
                render={<Link href="/register" />}
                nativeButton={false}
              >
                {t('signUp')}
              </Button>
            </div>
          </div>
        </div>

        <DeviceShowcase
          alt={t('deviceAlt')}
          id={DEMO_SECTION_ID}
          className="relative scroll-mt-24 md:scroll-mt-28"
        />

        <div className="relative z-10 mt-px -mx-8 md:-mx-16 lg:-mx-32 xl:-mx-48">
          <Separator className="h-px w-full" />
        </div>
      </div>
    </section>
  );
}
