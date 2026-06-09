'use client';

import { CloudUploadIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactElement } from 'react';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { FileDropZone } from '@/shared/ui/file-drop-zone';
import { Label } from '@/shared/ui/label';
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

import { BLOG_BLOCK_CAPTION_MAX_LEN } from '../model/limits';

export type MediaKind = 'image' | 'video';

export type MediaSubmit = {
  /** New file to upload, or null to keep the current one (edit mode). */
  file: File | null;
  /** Caption (image) / title (video). Empty string clears it. */
  text: string;
};

type MediaUploadDialogProps = {
  /** Render-prop trigger (uncontrolled mode). Omit when controlling `open`. */
  trigger?: ReactElement;
  /** Controlled open state — pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  kind: MediaKind;
  /** Edit mode: existing preview URL + text to prefill. */
  initialUrl?: string | null;
  initialText?: string;
  /** Whether a brand-new file must be chosen (add mode) or is optional (edit). */
  requireFile: boolean;
  maxBytes: number;
  busy?: boolean;
  onSubmit: (data: MediaSubmit) => void;
};

export function MediaUploadDialog({
  trigger,
  open: openProp,
  onOpenChange,
  kind,
  initialUrl,
  initialText = '',
  requireFile,
  maxBytes,
  busy = false,
  onSubmit,
}: MediaUploadDialogProps) {
  const t = useTranslations('blog-admin');
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setInternalOpen(next);
  };
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = useObjectUrl(file);
  const accept = kind === 'image' ? 'image/*' : 'video/*';

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      setFile(null);
      setText(initialText);
      setError(null);
    }, 220);
    return () => window.clearTimeout(id);
  }, [open, initialText]);

  function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith(`${kind}/`)) {
      setError(t('media.errors.wrongType'));
      return;
    }
    if (picked.size > maxBytes) {
      setError(t('media.errors.tooLarge'));
      return;
    }
    setError(null);
    setFile(picked);
  }

  const effectiveUrl = previewUrl ?? (file ? null : initialUrl ?? null);
  const canSubmit = (requireFile ? file !== null : true) && !busy;

  function handleSubmit() {
    if (requireFile && !file) {
      setError(t('media.errors.required'));
      return;
    }
    onSubmit({ file, text: text.trim() });
    setOpen(false);
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={setOpen}>
      {trigger ? <ResponsiveSheetTrigger render={trigger} /> : null}
      <ResponsiveSheetContent>
        <div className="flex h-full min-h-0 flex-col">
          <ResponsiveSheetHeader>
            <div className="flex flex-col gap-1">
              <ResponsiveSheetTitle>
                {t(`media.${kind}.title`)}
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription>
                {t(`media.${kind}.hint`)}
              </ResponsiveSheetDescription>
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

          <ResponsiveSheetBody className="flex flex-col gap-4">
            {effectiveUrl && kind === 'image' ? (
              <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object-URL / presigned preview, next/image N/A */}
                <img
                  src={effectiveUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              </div>
            ) : effectiveUrl && kind === 'video' ? (
              <video
                src={effectiveUrl}
                controls
                className="aspect-video w-full rounded-lg bg-black"
              />
            ) : null}

            <FileDropZone
              accept={accept}
              icon={<CloudUploadIcon className="size-5" />}
              prompt={
                file
                  ? file.name
                  : effectiveUrl
                    ? t('media.replace')
                    : t('media.pick')
              }
              hint={t(`media.${kind}.limit`)}
              onFiles={handleFiles}
              className="py-6"
            />

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="media-text"
                className="text-[13px] font-medium text-foreground"
              >
                {t(`media.${kind}.textLabel`)}
              </Label>
              <Textarea
                id="media-text"
                value={text}
                maxLength={BLOG_BLOCK_CAPTION_MAX_LEN}
                onChange={(e) => setText(e.target.value)}
                placeholder={t(`media.${kind}.textPlaceholder`)}
                className="min-h-16 text-[15px]"
              />
              <span className="self-end text-[11px] text-muted-foreground tabular-nums">
                {text.length}/{BLOG_BLOCK_CAPTION_MAX_LEN}
              </span>
            </div>

            {error ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            ) : null}
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
              type="button"
              size="lg"
              className="h-9 px-4"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {busy ? t('media.uploading') : t('media.save')}
            </Button>
          </ResponsiveSheetFooter>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
