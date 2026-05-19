'use client';

import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/shared/ui/carousel';
import { MenuGroup, MenuItem, MenuSeparator } from '@/shared/ui/menu';
import { PaymentCard } from '@/shared/ui/payment-card';

import type { WalletCard } from '../model/types';

import { KebabMenu } from './kebab-menu';
import { ManageCardsDialog } from './manage-cards-dialog';

type YourCardsProps = {
  cards: WalletCard[];
};

function LimitBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const isHigh = clamped >= 80;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          isHigh ? 'bg-amber-500' : 'bg-brand',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function YourCards({ cards: initialCards }: YourCardsProps) {
  const t = useTranslations('teach-dashboard.wallet.cards');
  const format = useFormatter();
  const notify = useNotify();
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(0);
  const [cards, setCards] = React.useState(initialCards);
  const [manageOpen, setManageOpen] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;
    const sync = () => {
      setSnapCount(api.scrollSnapList().length);
      setSelectedIndex(api.selectedScrollSnap());
    };
    api.on('select', sync);
    api.on('reInit', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {t('title')}
        </h3>
        <KebabMenu ariaLabel={t('more')}>
          <MenuGroup>
            <MenuItem onClick={() => setManageOpen(true)}>
              {t('menu.manage')}
            </MenuItem>
            <MenuItem
              onClick={() => notify.success(t('menu.copiedToClipboard'))}
            >
              {t('menu.copyNumber')}
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup>
            <MenuItem
              variant="destructive"
              onClick={() => notify.warning(t('menu.lockedNotice'))}
            >
              {t('menu.lockCard')}
            </MenuItem>
          </MenuGroup>
        </KebabMenu>
      </div>

      <div className="mt-4">
        <Carousel
          setApi={setApi}
          opts={{ align: 'start', containScroll: 'trimSnaps' }}
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {cards.map((card) => {
              const percent =
                (card.dailyWithdrawalUsed / card.dailyWithdrawalLimit) * 100;
              return (
                <CarouselItem
                  key={card.id}
                  className="basis-[88%] pl-3 sm:basis-1/2 md:pl-4 xl:basis-1/3"
                >
                  <div className="space-y-3">
                    <PaymentCard
                      bank={card.bank}
                      network={card.network}
                      holderName={card.holderName}
                      expiryMonth={card.expiryMonth}
                      expiryYear={card.expiryYear}
                      firstDigits={card.firstDigits}
                      last4={card.last4}
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {t('dailyLimitLabel')}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {format.number(card.dailyWithdrawalUsed, {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          })}{' '}
                          <span className="text-muted-foreground">
                            /{' '}
                            {format.number(card.dailyWithdrawalLimit, {
                              style: 'currency',
                              currency: 'RUB',
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </span>
                      </div>
                      <LimitBar percent={percent} />
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {snapCount > 1
              ? Array.from({ length: snapCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={t('goToCard', { index: i + 1 })}
                    aria-current={selectedIndex === i}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                      'size-1.5 rounded-full transition-colors',
                      selectedIndex === i
                        ? 'bg-brand'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))
              : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setManageOpen(true)}
          >
            {t('manageCards')}
          </Button>
        </div>
      </div>

      <ManageCardsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        cards={cards}
        onCardsChange={setCards}
      />
    </div>
  );
}
