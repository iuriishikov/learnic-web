import { getTranslations } from 'next-intl/server';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

import { FaqList } from './faq-list';

type FaqItem = {
  question: string;
  answer: string;
};

const SUPPORT_AVATARS = [
  { initials: 'AM', className: 'bg-brand/15 text-brand' },
  { initials: 'SK', className: 'bg-muted text-foreground' },
  { initials: 'ND', className: 'bg-brand/10 text-brand' },
] as const;

export async function FaqSection() {
  const t = await getTranslations('home.faq');
  const items = t.raw('items') as FaqItem[];

  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[768px] px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[40px] lg:leading-[1.15]">
            {t('title')}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground md:mt-5 md:text-lg">
            {t('description')}
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          <FaqList items={items} />
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 rounded-2xl bg-muted/60 px-6 py-10 text-center md:mt-20 md:px-10">
          <AvatarGroup>
            {SUPPORT_AVATARS.map((avatar) => (
              <Avatar key={avatar.initials} size="lg">
                <AvatarFallback
                  className={`${avatar.className} text-sm font-semibold`}
                >
                  {avatar.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {t('support.title')}
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t('support.description')}
            </p>
          </div>
          <Button
            className="h-11 gap-2 rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90"
            render={<a href="#" />}
            nativeButton={false}
          >
            {t('support.cta')}
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-[1216px] px-4 md:mt-14 md:px-6">
        <Separator />
      </div>
    </section>
  );
}
