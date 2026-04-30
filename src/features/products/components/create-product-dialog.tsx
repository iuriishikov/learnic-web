'use client';

import { ArrowRightIcon, GraduationCapIcon, RadioIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactElement, type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

import type { ProductType } from '../model/types';

type CreateProductDialogProps = {
  trigger: ReactElement;
  onCreate?: (type: ProductType) => void;
};

export function CreateProductDialog({
  trigger,
  onCreate,
}: CreateProductDialogProps) {
  const t = useTranslations('teach-products.create');
  const [open, setOpen] = useState(false);

  function handleSelect(type: ProductType) {
    onCreate?.(type);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        className="gap-0 p-0 sm:max-w-[520px]"
      >
        <DialogHeader className="gap-1.5 border-b border-border px-6 pt-6 pb-5">
          <DialogTitle className="text-lg">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ProductTypeOption
            type="course"
            label={t('options.course.label')}
            description={t('options.course.description')}
            icon={<GraduationCapIcon />}
            onSelect={handleSelect}
          />
          <ProductTypeOption
            type="webinar"
            label={t('options.webinar.label')}
            description={t('options.webinar.description')}
            icon={<RadioIcon />}
            onSelect={handleSelect}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t('footerHint')}</p>
          <DialogClose className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('cancel')}
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ProductTypeOptionProps = {
  type: ProductType;
  label: string;
  description: string;
  icon: ReactNode;
  onSelect: (type: ProductType) => void;
};

function ProductTypeOption({
  type,
  label,
  description,
  icon,
  onSelect,
}: ProductTypeOptionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(type)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { y: 0, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 text-left',
        'hover:border-brand/40 hover:shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand/15 [&>svg]:size-5">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="font-heading text-sm font-medium text-foreground">
          {label}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
        <ArrowRightIcon className="size-3.5" />
      </span>
    </motion.button>
  );
}
