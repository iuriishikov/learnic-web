'use client';

import { ImageIcon, UploadCloudIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Image } from '@/shared/ui/image';

import { deleteCoverAction, uploadCoverAction } from '../api/cover';
import { useAuth } from '@/shared/auth';
import { runUploadWithProgressToast } from './upload-progress';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_BYTES = 16 * 1024 * 1024;

export function CoverUploader() {
  const t = useTranslations('settings.profile.cover');
  const tErrors = useTranslations('settings.errors');
  const tProgress = useTranslations('settings.profile.upload');
  const notify = useNotify();
  const { user, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const previewUrl = useObjectUrl(previewFile);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!user) return null;

  const displayUrl = previewUrl ?? user.cover?.url ?? null;
  const hasCover = Boolean(displayUrl);

  function handlePick() {
    inputRef.current?.click();
  }

  function uploadFile(file: File) {
    if (file.size > MAX_BYTES) {
      notify.error(tErrors('fileTooLarge'));
      return;
    }
    setPreviewFile(file);
    startTransition(async () => {
      const result = await runUploadWithProgressToast({
        notify,
        title: tProgress('coverUploading'),
        description: file.name,
        successTitle: t('uploaded'),
        errorTitle: tErrors('uploadFailed'),
        run: async () => {
          const formData = new FormData();
          formData.set('file', file);
          return uploadCoverAction(formData);
        },
      });
      setPreviewFile(null);
      if (result.ok) {
        await refresh();
      }
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    uploadFile(file);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCoverAction();
      if (result.ok) {
        await refresh();
        notify.success(t('deleted'));
      } else {
        notify.error(tErrors('deleteFailed'));
      }
    });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={handlePick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePick();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors',
          'hover:bg-muted/60',
          isDragOver && 'border-brand bg-brand/5 text-brand',
          pending && 'pointer-events-none opacity-60',
        )}
      >
        {hasCover && displayUrl ? (
          // Presigned storage URL — bypass next/image's optimizer (no
          // remotePatterns config for arbitrary backend hosts).
          <Image
            src={displayUrl}
            alt={t('alt')}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            rounded="xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm">
            <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground">
              <UploadCloudIcon className="size-5" aria-hidden />
            </span>
            <p className="font-medium text-foreground">{t('cta')}</p>
            <p className="text-xs">{t('hint')}</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-2">
        {hasCover ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePick}
              disabled={pending}
              className="gap-2"
            >
              <ImageIcon className="size-4" aria-hidden />
              {t('replace')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={pending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {t('delete')}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePick}
            disabled={pending}
            className="gap-2"
          >
            <ImageIcon className="size-4" aria-hidden />
            {t('upload')}
          </Button>
        )}
      </div>
    </div>
  );
}
