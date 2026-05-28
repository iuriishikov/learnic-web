'use client';

import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CloudUploadIcon,
  GraduationCapIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useForm } from 'react-hook-form';

import {
  PRODUCT_TAGS_MAX,
  TagsField,
  productTagsKey,
  updateProductTagsAction,
  type Tag,
} from '@/features/product-tags';
import { useRouter } from '@/shared/config/i18n/navigation';
import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { Label } from '@/shared/ui/label';
import { RequiredMark } from '@/shared/ui/required-mark';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '@/shared/ui/responsive-sheet';
import { Textarea } from '@/shared/ui/textarea';

import { createProductAction } from '../api/create-product';
import { myProductsKey } from '../api/use-my-products';
import {
  createProductSchema,
  type CreateProductInput,
} from '../model/create-product';

type CreateProductDialogProps = {
  trigger: ReactElement;
};

const EMPTY_FORM: CreateProductInput = {
  type: 'course',
  title: '',
  description: '',
};

const COVER_MAX_BYTES = 4 * 1024 * 1024;

export function CreateProductDialog({ trigger }: CreateProductDialogProps) {
  const t = useTranslations('teach-products.create');
  const router = useRouter();
  const queryClient = useQueryClient();
  const notify = useNotify();

  const [open, setOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onTouched',
  });

  const titleError = form.formState.errors.title?.message;
  const descriptionError = form.formState.errors.description?.message;
  const submitting = form.formState.isSubmitting;

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      form.reset(EMPTY_FORM);
      setCoverFile(null);
      setCoverError(null);
      setTags([]);
    }, 220);
    return () => window.clearTimeout(id);
  }, [open, form]);

  function handleCoverPick(event: ReactChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCoverError(t('errors.coverInvalid'));
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverError(t('errors.coverTooLarge'));
      return;
    }
    setCoverError(null);
    setCoverFile(file);
  }

  function handleCoverRemove() {
    setCoverFile(null);
    setCoverError(null);
  }

  async function onSubmit(values: CreateProductInput) {
    const result = await createProductAction({ ...values, cover: coverFile });
    if (!result.ok) {
      notify.apiError(result.reason);
      return;
    }

    if (tags.length > 0) {
      const items = tags.map((tag) =>
        tag.id.startsWith('__pending-')
          ? ({ kind: 'new' as const, name: tag.name, color: tag.color })
          : ({ kind: 'existing' as const, tagId: tag.id }),
      );
      const tagResult = await updateProductTagsAction({
        productId: result.productId,
        items,
      });
      if (tagResult.ok) {
        queryClient.setQueryData(
          productTagsKey(result.productId),
          tagResult.items,
        );
      } else {
        notify.error(t('errors.tagsFailed'));
      }
    }

    queryClient.invalidateQueries({ queryKey: myProductsKey });
    setOpen(false);
    router.push(`/products/${result.productId}/editor`);
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={setOpen}>
      <ResponsiveSheetTrigger render={trigger} />
      <ResponsiveSheetContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex h-full min-h-0 flex-col"
        >
          <ResponsiveSheetHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand [&>svg]:size-5">
                <GraduationCapIcon />
              </span>
              <div className="flex flex-col gap-1">
                <ResponsiveSheetTitle>
                  {t('details.title.course')}
                </ResponsiveSheetTitle>
                <ResponsiveSheetDescription>
                  {t('details.description')}
                </ResponsiveSheetDescription>
              </div>
            </div>
            <ResponsiveSheetClose
              aria-label={t('actions.cancel')}
              className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <XIcon className="size-4" />
            </ResponsiveSheetClose>
          </ResponsiveSheetHeader>

          <ResponsiveSheetBody>
            <FormSection
              label={t('fields.cover.label')}
              hint={t('fields.optional')}
              error={coverError}
            >
              <CoverDropzone
                file={coverFile}
                onPick={() => coverInputRef.current?.click()}
                onRemove={handleCoverRemove}
                uploadTitle={t('fields.cover.uploadTitle')}
                uploadHint={t('fields.cover.uploadHint')}
                removeLabel={t('fields.cover.remove')}
                replaceLabel={t('fields.cover.replace')}
                alt={t('fields.cover.alt')}
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverPick}
              />
            </FormSection>

            <FormSection
              id="cp-title"
              label={t('fields.title.label')}
              required
              error={titleError ? t(`errors.${titleError}`) : null}
            >
              <TextInput
                id="cp-title"
                autoComplete="off"
                placeholder={t('fields.title.placeholder')}
                aria-invalid={Boolean(titleError)}
                className="h-10 text-[15px]"
                {...form.register('title')}
              />
            </FormSection>

            <FormSection
              id="cp-description"
              label={t('fields.description.label')}
              hint={t('fields.optional')}
              error={descriptionError ? t(`errors.${descriptionError}`) : null}
            >
              <Textarea
                id="cp-description"
                placeholder={t('fields.description.placeholder.course')}
                aria-invalid={Boolean(descriptionError)}
                className="min-h-24 max-h-64 text-[15px]"
                {...form.register('description')}
              />
            </FormSection>

            <FormSection
              label={t('fields.tags.label')}
              hint={t('fields.tags.hint', { max: PRODUCT_TAGS_MAX })}
            >
              <TagsField value={tags} onChange={setTags} />
            </FormSection>
          </ResponsiveSheetBody>

          <ResponsiveSheetFooter className="justify-between">
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t('footerHint')}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <ResponsiveSheetClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-9"
                  >
                    {t('actions.cancel')}
                  </Button>
                }
              />
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-9 px-4"
              >
                {submitting ? t('actions.submitting') : t('actions.submit')}
              </Button>
            </div>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

type CoverDropzoneProps = {
  file: File | null;
  onPick: () => void;
  onRemove: () => void;
  uploadTitle: string;
  uploadHint: string;
  removeLabel: string;
  replaceLabel: string;
  alt: string;
};

function CoverDropzone({
  file,
  onPick,
  onRemove,
  uploadTitle,
  uploadHint,
  removeLabel,
  replaceLabel,
  alt,
}: CoverDropzoneProps) {
  const previewUrl = useObjectUrl(file);

  if (file && previewUrl) {
    return (
      <div className="group relative overflow-hidden rounded-lg ring-1 ring-foreground/10">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            src={previewUrl}
            alt={alt}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute right-2 top-2 flex gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={onPick}
            aria-label={replaceLabel}
            className="bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
          >
            <CloudUploadIcon />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={onRemove}
            aria-label={removeLabel}
            className="bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors',
        'hover:border-brand/40 hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10 [&>svg]:size-5">
        <CloudUploadIcon />
      </span>
      <span className="text-sm font-medium text-foreground">
        {uploadTitle}
      </span>
      <span className="text-xs text-muted-foreground">{uploadHint}</span>
    </button>
  );
}

function FormSection({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
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
          {required ? <RequiredMark /> : null}
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
