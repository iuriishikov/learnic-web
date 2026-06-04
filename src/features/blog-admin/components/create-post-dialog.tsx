'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { FilePlus2Icon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/shared/config/i18n/navigation';
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

import { createPostAction } from '../api/posts';
import { useBlogErrorToast } from '../lib/use-blog-errors';
import { postFormSchema, slugifyTitle, type PostFormInput } from '../model/post-form';

type CreatePostDialogProps = {
  trigger: ReactElement;
};

const EMPTY: PostFormInput = { title: '', slug: '' };

export function CreatePostDialog({ trigger }: CreatePostDialogProps) {
  const t = useTranslations('blog-admin');
  const router = useRouter();
  const errorToast = useBlogErrorToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  // Until the user edits the slug by hand, keep it synced from the title.
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const titleValue = form.watch('title');

  useEffect(() => {
    if (slugTouched) return;
    form.setValue('slug', slugifyTitle(titleValue), { shouldValidate: false });
  }, [titleValue, slugTouched, form]);

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      form.reset(EMPTY);
      setSlugTouched(false);
    }, 220);
    return () => window.clearTimeout(id);
  }, [open, form]);

  const titleError = form.formState.errors.title?.message;
  const slugError = form.formState.errors.slug?.message;
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: PostFormInput) {
    const result = await createPostAction(values);
    if (!result.ok) {
      if (result.reason === 'slug-taken') {
        form.setError('slug', { message: 'errors.slugTaken' });
        return;
      }
      if (result.reason === 'validation') {
        form.setError('slug', { message: 'errors.slugFormat' });
        return;
      }
      errorToast(result.reason);
      return;
    }
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    router.push(`/admin/blog/${result.data.id}/edit`);
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
                <FilePlus2Icon />
              </span>
              <div className="flex flex-col gap-1">
                <ResponsiveSheetTitle>
                  {t('create.title')}
                </ResponsiveSheetTitle>
                <ResponsiveSheetDescription>
                  {t('create.description')}
                </ResponsiveSheetDescription>
              </div>
            </div>
            <ResponsiveSheetClose
              aria-label={t('create.cancel')}
              className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <XIcon className="size-4" />
            </ResponsiveSheetClose>
          </ResponsiveSheetHeader>

          <ResponsiveSheetBody>
            <Section
              id="cp-title"
              label={t('create.fields.title')}
              required
              error={titleError ? t(titleError) : null}
            >
              <TextInput
                id="cp-title"
                autoComplete="off"
                placeholder={t('create.fields.titlePlaceholder')}
                aria-invalid={Boolean(titleError)}
                className="h-10 text-[15px]"
                {...form.register('title')}
              />
            </Section>

            <Section
              id="cp-slug"
              label={t('create.fields.slug')}
              required
              hint={t('create.fields.slugHint')}
              error={slugError ? t(slugError) : null}
            >
              <TextInput
                id="cp-slug"
                autoComplete="off"
                inputMode="url"
                placeholder="my-post"
                aria-invalid={Boolean(slugError)}
                className="h-10 font-mono text-[15px]"
                {...form.register('slug', {
                  onChange: () => setSlugTouched(true),
                })}
              />
            </Section>
          </ResponsiveSheetBody>

          <ResponsiveSheetFooter className="justify-end">
            <ResponsiveSheetClose
              render={
                <Button type="button" variant="ghost" size="lg" className="h-9">
                  {t('create.cancel')}
                </Button>
              }
            />
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-9 px-4"
            >
              {submitting ? t('create.submitting') : t('create.submit')}
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function Section({
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
        <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
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
