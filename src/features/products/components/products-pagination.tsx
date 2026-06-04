'use client';

import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '@/shared/ui/pagination';

type ProductsPaginationProps = {
  activePage: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  previousLabel: string;
  nextLabel: string;
  /**
   * Accessible label for the compact mobile position indicator, e.g.
   * `(3, 8) => "Страница 3 из 8"`. Only read by screen readers — the
   * visible text is the language-neutral `3 / 8`.
   */
  positionLabel: (current: number, total: number) => string;
  className?: string;
};

/**
 * Shared products pagination (marketplace + "my notes").
 *
 * From `md` up it renders the full `1 2 3 … 8 9 10` numbered design.
 * On mobile that row — `Назад` + up to ten 36px page buttons + `Вперёд`
 * — overruns a 375px viewport and pushes `Вперёд` off-screen, so the
 * numbered cluster is replaced by a `Назад  X / Y  Вперёд` stepper that
 * fits any phone width. `edge=3` matches the reference cluster shape.
 */
export function ProductsPagination({
  activePage,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  positionLabel,
  className,
}: ProductsPaginationProps) {
  const range = useMemo(
    () => paginationRange(activePage, totalPages),
    [activePage, totalPages],
  );

  return (
    <Pagination
      size="lg"
      align="between"
      className={cn('mt-8 md:mt-10', className)}
    >
      <PaginationPrevious
        variant="outline"
        disabled={activePage <= 1}
        onClick={() => onPageChange(activePage - 1)}
        text={previousLabel}
      />

      {/* Mobile: compact position indicator (numbered cluster is hidden) */}
      <span className="text-sm font-medium tabular-nums text-foreground md:hidden">
        <span aria-hidden>
          {activePage} / {totalPages}
        </span>
        <span className="sr-only">
          {positionLabel(activePage, totalPages)}
        </span>
      </span>

      {/* Tablet / desktop: the full numbered cluster */}
      <PaginationContent className="hidden md:flex">
        {range.map((entry, i) =>
          entry === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                isActive={entry === activePage}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
      </PaginationContent>

      <PaginationNext
        variant="outline"
        disabled={activePage >= totalPages}
        onClick={() => onPageChange(activePage + 1)}
        text={nextLabel}
      />
    </Pagination>
  );
}
