'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  Code2Icon,
  type LucideIcon,
  MessagesSquareIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';
import { GridBackdrop } from '@/shared/ui/grid-backdrop';

type ResourceKey = 'documentation' | 'blog' | 'chat';

const RESOURCES: { key: ResourceKey; icon: LucideIcon; href: string }[] = [
  { key: 'documentation', icon: Code2Icon, href: '#' },
  { key: 'blog', icon: BookOpenIcon, href: '#' },
  { key: 'chat', icon: MessagesSquareIcon, href: '#' },
];

export function NotFoundContent() {
  const t = useTranslations('not-found');
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative isolate -mt-20 w-full overflow-hidden md:-mt-24">
      <div className="relative mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="relative pt-32 pb-12 md:pt-44 md:pb-16">
          <GridBackdrop
            className="-inset-x-8 -bottom-12 md:-inset-x-16 md:-bottom-16 lg:-inset-x-32 xl:-inset-x-48"
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex flex-col items-center text-center"
          >
            <p className="text-sm font-semibold text-brand">{t('label')}</p>

            <h1 className="mt-3 max-w-[860px] text-pretty text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground md:mt-5 md:text-6xl lg:text-[72px]">
              {t('title')}
            </h1>

            <p className="mt-4 max-w-[640px] text-pretty text-base leading-[1.55] text-muted-foreground md:mt-6 md:text-lg">
              {t('description')}
            </p>

            <div className="mt-8 flex w-full flex-col-reverse gap-3 md:mt-12 md:w-auto md:flex-row md:items-center md:justify-center">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                className="h-12 w-full gap-2 rounded-lg px-5 text-base font-medium md:w-auto md:min-w-[120px]"
              >
                <ArrowLeftIcon className="size-[18px]" />
                {t('actions.goBack')}
              </Button>
              <Button
                className="h-12 w-full rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90 md:w-auto md:min-w-[120px]"
                render={<Link href="/" />}
                nativeButton={false}
              >
                {t('actions.goHome')}
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.08,
                delayChildren: reduceMotion ? 0 : 0.15,
              },
            },
          }}
          className="relative grid grid-cols-1 gap-6 pt-12 pb-16 md:grid-cols-3 md:pt-20 md:pb-24"
        >
          {RESOURCES.map(({ key, icon: Icon, href }) => (
            <motion.article
              key={key}
              variants={fadeUp}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col rounded-xl bg-muted/50 p-6 md:p-7"
            >
              <Icon className="size-6 text-brand" strokeWidth={2} />
              <h3 className="mt-10 text-base font-semibold text-foreground md:mt-14">
                {t(`resources.${key}.title`)}
              </h3>
              <p className="mt-1 text-sm leading-[1.55] text-muted-foreground">
                {t(`resources.${key}.description`)}
              </p>
              <Link
                href={href}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
              >
                {t(`resources.${key}.cta`)}
                <ArrowRightIcon className="size-4" />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
