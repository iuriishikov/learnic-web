'use client';

import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  GraduationCapIcon,
  RadioIcon,
  XIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shared/ui/input-group';
import { Label } from '@/shared/ui/label';
import { TextareaAutosize } from '@/shared/ui/textarea-autosize';

import { createProductAction } from '../api/create-product';
import { myProductsKey } from '../api/use-my-products';
import {
  createProductSchema,
  type CreateProductInput,
} from '../model/create-product';
import type { ProductType } from '../model/types';

import { CreateProductAurora } from './create-product-aurora';

type CreateProductDialogProps = {
  trigger: ReactElement;
};

type Step = 'choose' | 'details';

const STEP_VARIANTS: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 24,
  }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
  }),
};

export function CreateProductDialog({ trigger }: CreateProductDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [direction, setDirection] = useState(1);
  const [productType, setProductType] = useState<ProductType | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // reset after the close animation finishes so users don't see the flicker.
      window.setTimeout(() => {
        setStep('choose');
        setProductType(null);
        setDirection(1);
      }, 200);
    }
  }

  function handlePickType(type: ProductType) {
    setProductType(type);
    setDirection(1);
    setStep('details');
  }

  function handleBack() {
    setDirection(-1);
    setStep('choose');
  }

  function handleCreated(productId: string) {
    queryClient.invalidateQueries({ queryKey: myProductsKey });
    handleOpenChange(false);
    router.push(`/products/${productId}/editor`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent
        className="overflow-hidden gap-0 p-0 sm:max-w-[760px] md:max-w-[820px]"
        showCloseButton={false}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === 'choose' ? (
            <motion.div
              key="choose"
              custom={direction}
              variants={STEP_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <ChooseStep onPick={handlePickType} />
            </motion.div>
          ) : (
            <motion.div
              key="details"
              custom={direction}
              variants={STEP_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <DetailsStep
                productType={productType ?? 'course'}
                onBack={handleBack}
                onCreated={handleCreated}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <DialogClose
          aria-label="Close"
          className={cn(
            'absolute top-3 right-3 z-30 inline-flex size-8 items-center justify-center rounded-md transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            step === 'details'
              ? 'text-white/80 hover:bg-white/15 hover:text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <XIcon className="size-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function ChooseStep({ onPick }: { onPick: (type: ProductType) => void }) {
  const t = useTranslations('teach-products.create');

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1.5 px-6 pt-6 pb-5 md:px-8 md:pt-8">
        <DialogTitle className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          {t('chooseTitle')}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {t('chooseDescription')}
        </DialogDescription>
      </div>

      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 md:px-6 md:pb-6">
        <TypeOption
          type="course"
          label={t('options.course.label')}
          description={t('options.course.description')}
          icon={<GraduationCapIcon />}
          onPick={onPick}
        />
        <TypeOption
          type="webinar"
          label={t('options.webinar.label')}
          description={t('options.webinar.description')}
          icon={<RadioIcon />}
          onPick={onPick}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3 md:px-6">
        <p className="text-xs text-muted-foreground">{t('footerHint')}</p>
        <DialogClose className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t('actions.cancel')}
        </DialogClose>
      </div>
    </div>
  );
}

type TypeOptionProps = {
  type: ProductType;
  label: string;
  description: string;
  icon: ReactNode;
  onPick: (type: ProductType) => void;
};

function TypeOption({
  type,
  label,
  description,
  icon,
  onPick,
}: TypeOptionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onPick(type)}
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

type DetailsStepProps = {
  productType: ProductType;
  onBack: () => void;
  onCreated: (productId: string) => void;
};

function DetailsStep({ productType, onBack, onCreated }: DetailsStepProps) {
  const t = useTranslations('teach-products.create');
  const notify = useNotify();

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      type: productType,
      title: '',
      description: '',
      hours: undefined,
    },
    mode: 'onTouched',
  });

  const titleError = form.formState.errors.title?.message;
  const descriptionError = form.formState.errors.description?.message;
  const hoursError = form.formState.errors.hours?.message;
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateProductInput) {
    const result = await createProductAction(values);
    if (result.ok) {
      onCreated(result.productId);
      return;
    }
    notify.apiError(result.reason);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="flex flex-col gap-5 px-6 pt-6 pb-4 md:px-8 md:pt-8">
        <header className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand [&>svg]:size-5">
            {productType === 'course' ? <GraduationCapIcon /> : <RadioIcon />}
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight md:text-xl">
              {t(`details.title.${productType}`)}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {t('details.description')}
            </DialogDescription>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          <FormRow
            id="cp-title"
            label={t('fields.title.label')}
            error={titleError ? t(`errors.${titleError}`) : null}
          >
            <Input
              id="cp-title"
              autoComplete="off"
              autoFocus
              placeholder={t('fields.title.placeholder')}
              aria-invalid={Boolean(titleError)}
              className="h-10 text-[15px]"
              {...form.register('title')}
            />
          </FormRow>

          <FormRow
            id="cp-description"
            label={t('fields.description.label')}
            hint={t('fields.optional')}
            error={descriptionError ? t(`errors.${descriptionError}`) : null}
          >
            <TextareaAutosize
              id="cp-description"
              placeholder={t(`fields.description.placeholder.${productType}`)}
              aria-invalid={Boolean(descriptionError)}
              className="min-h-24 max-h-64 text-[15px]"
              {...form.register('description')}
            />
          </FormRow>

          <FormRow
            id="cp-hours"
            label={t('fields.hours.label')}
            hint={t('fields.optional')}
            error={hoursError ? t(`errors.${hoursError}`) : null}
          >
            <InputGroup className="h-10">
              <InputGroupAddon>
                <ClockIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="cp-hours"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                step={1}
                placeholder={t('fields.hours.placeholder')}
                aria-invalid={Boolean(hoursError)}
                className="text-[15px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                {...form.register('hours', {
                  setValueAs: (v) =>
                    v === '' || v === null || v === undefined
                      ? undefined
                      : Number(v),
                })}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{t('fields.hours.suffix')}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </FormRow>
        </div>
      </div>

      <CreateProductAurora productType={productType} />

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3 md:col-span-2 md:px-8">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          className="h-9 gap-1"
        >
          <ArrowLeftIcon />
          {t('actions.back')}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-9 px-4"
        >
          {submitting ? t('actions.submitting') : t('actions.submit')}
        </Button>
      </div>
    </form>
  );
}

function FormRow({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label
          htmlFor={id}
          className="text-[13px] font-medium text-foreground"
        >
          {label}
        </Label>
        {hint ? (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          role="alert"
          className="text-xs font-medium leading-tight text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
