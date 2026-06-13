import { getTranslations } from 'next-intl/server';

import { listAdminsAction } from '@/features/admins';
import { Link } from '@/shared/config/i18n/navigation';
import { AvatarGroup } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { UserAvatar } from '@/shared/ui/user-avatar';

import { FaqList } from './faq-list';

type FaqItem = {
  question: string;
  answer: string;
};

const SUPPORT_AVATAR_LIMIT = 3;

export async function FaqSection() {
  const [t, adminsResult] = await Promise.all([
    getTranslations('home.faq'),
    listAdminsAction({ limit: SUPPORT_AVATAR_LIMIT }),
  ]);
  const items = t.raw('items') as FaqItem[];
  // Secondary content: on backend failure the avatar row simply hides.
  const admins = adminsResult.ok ? adminsResult.data : [];

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
          {admins.length > 0 && (
            <AvatarGroup>
              {admins.map((admin) => (
                <UserAvatar
                  key={admin.id}
                  user={admin}
                  size="lg"
                  shape="circle"
                  showStatus={false}
                />
              ))}
            </AvatarGroup>
          )}
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
            render={<Link href="/help" />}
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
