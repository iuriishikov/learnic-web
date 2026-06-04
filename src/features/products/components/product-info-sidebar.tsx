'use client';

import { ClockIcon, GiftIcon, LockIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';

import { ProductTypeChip } from './product-info-badges';
import { InfoCard, InfoRow } from './product-info-card';
import type { Product } from '../model/types';

/**
 * Enrollment rail for the public landing: the enroll CTA plus a compact
 * quick-facts list. Learner-facing — no internal ids/emails/status.
 *
 * Products carry no price at this phase, so the rail leads straight with the
 * CTA (no price line). The CTA is an honest placeholder — the backend has no
 * self-enroll / purchase endpoint yet (access is gift-only), so it announces
 * "coming soon" via a toast rather than silently doing nothing. Wire it to the
 * real action once the enrollment endpoint ships.
 */
export function ProductInfoSidebar({ product }: { product: Product }) {
  const t = useTranslations('marketplace.detail');
  const formatter = useFormatter();
  const notify = useNotify();
  const isPrivate = product.visibility === 'private';

  const onEnroll = () => {
    notify.info(t('enroll.soonTitle'), {
      description: t('enroll.soonDescription'),
    });
  };

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        {isPrivate ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-3.5 py-3">
            <LockIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">
                {t('enroll.privateTitle')}
              </p>
              <p className="text-xs leading-snug text-muted-foreground">
                {t('enroll.privateHint')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              onClick={onEnroll}
              className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <GiftIcon className="size-4" />
              {t('enroll.cta')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('enroll.guarantee')}
            </p>
          </>
        )}
      </section>

      <InfoCard title={t('meta.title')}>
        <dl className="divide-y divide-border">
          <InfoRow label={t('meta.type')}>
            <ProductTypeChip type={product.type} />
          </InfoRow>
          <InfoRow label={t('meta.duration')}>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
              {product.durationHours > 0
                ? t('meta.durationValue', { hours: product.durationHours })
                : t('meta.durationUnset')}
            </span>
          </InfoRow>
          <InfoRow label={t('meta.updatedAt')}>
            {formatter.dateTime(new Date(product.updatedAt), {
              dateStyle: 'medium',
            })}
          </InfoRow>
        </dl>
      </InfoCard>
    </>
  );
}
