'use client';

import {
  ArchiveIcon,
  CalendarClockIcon,
  ClockIcon,
  CopyIcon,
  EllipsisIcon,
  GraduationCapIcon,
  LayersIcon,
  PencilIcon,
  RadioIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import type { Product } from '../model/types';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('teach-products.card');
  const tStatus = useTranslations('teach-products.status');
  const tType = useTranslations('teach-products.type');
  const reduceMotion = useReducedMotion();
  const format = useFormatter();
  const locale = useLocale();

  const isCourse = product.type === 'course';
  const updated = format.relativeTime(new Date(product.updatedAt), {
    now: new Date(),
  });
  const studentsLabel = new Intl.NumberFormat(locale).format(
    product.studentsCount,
  );

  const cover = `linear-gradient(135deg, oklch(0.85 0.12 ${product.coverHue}) 0%, oklch(0.62 0.2 ${(product.coverHue + 30) % 360}) 100%)`;

  const actionItems = (
    <>
      <ItemRow icon={<PencilIcon />} label={t('actions.edit')} />
      <ItemRow icon={<CopyIcon />} label={t('actions.duplicate')} />
      <Separator />
      <ItemRow icon={<ArchiveIcon />} label={t('actions.archive')} />
      <ItemRow
        icon={<Trash2Icon />}
        label={t('actions.delete')}
        destructive
      />
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.article
          whileHover={reduceMotion ? undefined : { y: -3 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className={cn(
            'group/product relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow',
            'hover:ring-foreground/15 hover:shadow-lg dark:hover:shadow-black/40',
          )}
        >
          <div
            className="relative h-32 w-full"
            style={{ backgroundImage: cover }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 top-3 flex items-start justify-between px-3">
              <Badge
                variant="secondary"
                className="border-0 bg-black/30 text-white backdrop-blur-sm"
              >
                {isCourse ? (
                  <GraduationCapIcon className="size-3" />
                ) : (
                  <RadioIcon className="size-3" />
                )}
                {isCourse ? tType('course') : tType('webinar')}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t('actions.more')}
                      className="bg-black/25 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover/product:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem>
                    <PencilIcon /> {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CopyIcon /> {t('actions.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ArchiveIcon /> {t('actions.archive')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive">
                    <Trash2Icon /> {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="absolute inset-x-0 bottom-3 px-3">
              <StatusChip status={product.status} label={tStatus(product.status)} />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 p-4">
            <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {product.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {product.description}
            </p>

            <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
              <Stat icon={<UsersIcon />} label={studentsLabel} hint={t('stats.students')} />
              {isCourse && product.lessonsCount ? (
                <Stat
                  icon={<LayersIcon />}
                  label={t('stats.lessons', { count: product.lessonsCount })}
                />
              ) : null}
              {!isCourse && product.scheduledAt ? (
                <Stat
                  icon={<CalendarClockIcon />}
                  label={format.dateTime(new Date(product.scheduledAt), {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              ) : null}
              {product.durationMinutes ? (
                <Stat
                  icon={<ClockIcon />}
                  label={formatDuration(product.durationMinutes, t)}
                />
              ) : null}
            </dl>
          </div>

          <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            {t('updated', { time: updated })}
          </div>
        </motion.article>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">{actionItems}</ContextMenuContent>
    </ContextMenu>
  );
}

function ItemRow({
  icon,
  label,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
}) {
  return (
    <ContextMenuItem
      className={cn(
        destructive &&
          'text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive',
      )}
    >
      {icon} {label}
    </ContextMenuItem>
  );
}

function Separator() {
  return <ContextMenuSeparator />;
}

function StatusChip({
  status,
  label,
}: {
  status: Product['status'];
  label: string;
}) {
  const styles: Record<Product['status'], string> = {
    published:
      'bg-emerald-500/15 text-emerald-100 ring-emerald-300/40 dark:bg-emerald-400/20 dark:text-emerald-50',
    draft:
      'bg-amber-500/20 text-amber-50 ring-amber-200/50 dark:bg-amber-400/25',
    archived:
      'bg-zinc-500/30 text-zinc-50 ring-zinc-200/40 dark:bg-zinc-400/20',
  };

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-medium uppercase tracking-wide ring-1 backdrop-blur-sm',
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

function Stat({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground/80 [&>svg]:size-3.5">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
      {hint ? <span className="text-muted-foreground/70">{hint}</span> : null}
    </div>
  );
}

function formatDuration(
  minutes: number,
  t: (key: string, values?: Record<string, number>) => string,
) {
  if (minutes < 60) return t('stats.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return t('stats.hours', { count: hours });
  return `${t('stats.hours', { count: hours })} ${t('stats.minutes', { count: remainder })}`;
}
