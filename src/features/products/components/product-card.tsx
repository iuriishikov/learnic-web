'use client';

import {
  ArchiveIcon,
  ClockIcon,
  EllipsisIcon,
  GraduationCapIcon,
  LayersIcon,
  PencilIcon,
  RadioIcon,
  RocketIcon,
  TagIcon,
  Trash2Icon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth';
import { useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
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

import {
  useArchiveProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
} from '../api/use-product-mutations';
import { useProductPermissions } from '../api/use-product-permissions';
import {
  hasDescriptionContent,
  looksLikeHtml,
} from '../lib/description-html';
import type { Currency, Product } from '../model/types';

import { ProductCover } from './product-cover';

type ProductCardProps = {
  product: Product;
};

const CURRENCY_LOCALE_OVERRIDE: Partial<Record<Currency, string>> = {
  RUB: 'ru-RU',
  KZT: 'ru-KZ',
  BYN: 'ru-BY',
};

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('teach-products.card');
  const tStatus = useTranslations('teach-products.status');
  const tType = useTranslations('teach-products.type');
  const tArchive = useTranslations(
    'teach-products.editor.settings.status.archiveConfirm',
  );
  const tDelete = useTranslations(
    'teach-products.editor.settings.danger.deleteConfirm',
  );
  const reduceMotion = useReducedMotion();
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const { user } = useAuth();
  const isOwner = !!user && user.oid === product.author.id;
  const isCourse = product.type === 'course';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  // Owners get all perms implicitly server-side — skip the round-trip.
  // For collaborators, fetch only when a menu actually opens.
  const perms = useProductPermissions(product.id, {
    enabled: !isOwner && (dropdownOpen || contextOpen),
  });

  const archive = useArchiveProductMutation(product.id);
  const publish = usePublishProductMutation(product.id);
  const remove = useDeleteProductMutation(product.id);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editorHref = `/products/${product.id}/editor`;
  const openEditor = useCallback(() => {
    router.push(editorHref);
  }, [router, editorHref]);

  const canPublish =
    !isCourse &&
    product.status === 'draft' &&
    (isOwner || perms.canPublish);

  const canArchive =
    product.status !== 'archived' &&
    product.status !== 'banned' &&
    !(isCourse && product.status === 'draft') &&
    (isOwner || perms.canArchive);

  // Server enforces author-only on DELETE — show only to owners.
  const canDelete = isOwner && product.status === 'draft';

  const handlePublish = () => {
    publish.mutate();
  };
  const handleArchive = () => {
    archive.mutate(undefined, {
      onSuccess: () => setConfirmArchive(false),
    });
  };
  const handleDelete = () => {
    remove.mutate(undefined, {
      onSuccess: () => setConfirmDelete(false),
    });
  };

  const updated = format.relativeTime(new Date(product.updatedAt), {
    now: new Date(),
  });

  const lessons = product.webinarDetails?.totalLessons;
  const priceLabel = formatPrice(
    product.priceAmount,
    product.priceCurrency,
    locale,
  );

  const showSeparator = canPublish || canArchive || canDelete;

  return (
    <>
      <ContextMenu onOpenChange={setContextOpen}>
        <ContextMenuTrigger>
          <motion.article
            role="button"
            tabIndex={0}
            aria-label={product.title}
            onClick={openEditor}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openEditor();
              }
            }}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className={cn(
              'group/product relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow',
              'hover:ring-foreground/15 hover:shadow-lg dark:hover:shadow-black/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <ProductCover
              productId={product.id}
              initialProduct={product}
              className="h-32"
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
                <div onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu onOpenChange={setDropdownOpen}>
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
                      <DropdownMenuItem onClick={openEditor}>
                        <PencilIcon /> {t('actions.edit')}
                      </DropdownMenuItem>
                      {canPublish ? (
                        <DropdownMenuItem
                          onClick={handlePublish}
                          disabled={publish.isPending}
                        >
                          <RocketIcon /> {t('actions.publish')}
                        </DropdownMenuItem>
                      ) : null}
                      {showSeparator ? <DropdownMenuSeparator /> : null}
                      {canArchive ? (
                        <DropdownMenuItem
                          onClick={() => setConfirmArchive(true)}
                          disabled={archive.isPending}
                        >
                          <ArchiveIcon /> {t('actions.archive')}
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setConfirmDelete(true)}
                          disabled={remove.isPending}
                        >
                          <Trash2Icon /> {t('actions.delete')}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-3 px-3">
                <StatusChip
                  status={product.status}
                  label={tStatus(product.status)}
                />
              </div>
            </ProductCover>

            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
                {product.title}
              </h3>
              {hasDescriptionContent(product.description) ? (
                looksLikeHtml(product.description) ? (
                  <div
                    className="text-sm leading-relaxed text-muted-foreground line-clamp-2 [&_*]:!my-0 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 whitespace-pre-line">
                    {product.description}
                  </p>
                )
              ) : null}

              <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
                {product.durationHours > 0 ? (
                  <Stat
                    icon={<ClockIcon />}
                    label={t('stats.hours', { count: product.durationHours })}
                  />
                ) : null}
                {!isCourse && lessons ? (
                  <Stat
                    icon={<LayersIcon />}
                    label={t('stats.lessons', { count: lessons })}
                  />
                ) : null}
                {priceLabel ? (
                  <Stat icon={<TagIcon />} label={priceLabel} />
                ) : null}
              </dl>
            </div>

            <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              {t('updated', { time: updated })}
            </div>
          </motion.article>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={openEditor}>
            <PencilIcon /> {t('actions.edit')}
          </ContextMenuItem>
          {canPublish ? (
            <ContextMenuItem
              onClick={handlePublish}
              disabled={publish.isPending}
            >
              <RocketIcon /> {t('actions.publish')}
            </ContextMenuItem>
          ) : null}
          {showSeparator ? <ContextMenuSeparator /> : null}
          {canArchive ? (
            <ContextMenuItem
              onClick={() => setConfirmArchive(true)}
              disabled={archive.isPending}
            >
              <ArchiveIcon /> {t('actions.archive')}
            </ContextMenuItem>
          ) : null}
          {canDelete ? (
            <ContextMenuItem
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={remove.isPending}
            >
              <Trash2Icon /> {t('actions.delete')}
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tArchive('title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tArchive('description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archive.isPending}>
              {tArchive('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={archive.isPending}
              onClick={handleArchive}
            >
              {archive.isPending ? tArchive('confirming') : tArchive('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDelete('title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDelete('description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {tDelete('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={handleDelete}
            >
              {remove.isPending ? tDelete('confirming') : tDelete('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
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
    banned:
      'bg-rose-500/25 text-rose-50 ring-rose-300/50 dark:bg-rose-400/25',
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

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground/80 [&>svg]:size-3.5">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}

function formatPrice(
  amount: string,
  currency: Currency,
  locale: string,
): string | null {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  const targetLocale = CURRENCY_LOCALE_OVERRIDE[currency] ?? locale;
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${amount} ${currency}`;
  }
}
