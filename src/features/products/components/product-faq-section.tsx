'use client';

import { HelpCircleIcon, RotateCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { useProductQA } from '../api/use-product-qa';

import { InfoCard } from './product-info-card';

/**
 * Public Q&A (FAQ) for the product landing. `GET /products/{id}/qa` is an
 * unauthenticated endpoint, so anonymous marketplace visitors see it too.
 *
 * Product-wide (every product type has Q&A), so it's rendered as a shared
 * section in the main column rather than via the per-type section registry.
 * Secondary content: an empty list or a load error hides / degrades the
 * block — it never escalates to a page-level error.
 */
export function ProductFaqSection({ productId }: { productId: string }) {
  const t = useTranslations('marketplace.detail.faq');
  const query = useProductQA(productId);

  // No questions yet — drop the section entirely so the landing stays tight.
  if (query.isSuccess && query.data.length === 0) return null;

  return (
    <InfoCard title={t('title')} icon={HelpCircleIcon}>
      {query.isPending ? (
        <FaqSkeleton />
      ) : query.isError ? (
        <FaqError
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : (
        <Accordion className="gap-0">
          {query.data.map((entry) => (
            <AccordionItem key={entry.id} value={entry.id}>
              <AccordionTrigger className="text-sm font-medium text-foreground">
                {entry.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {entry.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </InfoCard>
  );
}

function FaqSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

function FaqError({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const t = useTranslations('marketplace.detail.faq.error');
  return (
    <div role="alert" className="rounded-xl bg-muted/40 px-4 py-5">
      <p className="text-sm font-medium text-foreground">{t('title')}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-3 gap-1.5"
      >
        <RotateCwIcon className={cn('size-3.5', isRetrying && 'animate-spin')} />
        {t('retry')}
      </Button>
    </div>
  );
}
