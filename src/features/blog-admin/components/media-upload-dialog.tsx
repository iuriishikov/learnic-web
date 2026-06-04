'use client';

import { CloudUploadIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
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
  trigger: ReactElement;
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
  kind,
  initialUrl,
  initialText = '',
  requireFile,
  maxBytes,
  busy = false,
  onSubmit,
}: MediaUploadDialogProps) {
  const t = useTranslations('blog-admin');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = '';
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
      <ResponsiveSheetTrigger render={trigger} />
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

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
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
                {file
                  ? file.name
                  : effectiveUrl
                    ? t('media.replace')
                    : t('media.pick')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`media.${kind}.limit`)}
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handlePick}
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
