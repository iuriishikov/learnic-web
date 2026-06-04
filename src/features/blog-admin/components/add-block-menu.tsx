'use client';

import { ImageIcon, TypeIcon, VideoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';

import {
  BLOG_IMAGE_BLOCK_MAX_BYTES,
  BLOG_VIDEO_BLOCK_MAX_BYTES,
} from '../model/limits';
import { MediaUploadDialog, type MediaSubmit } from './media-upload-dialog';

type AddBlockMenuProps = {
  onAddHtml: () => void;
  onAddImage: (data: MediaSubmit) => void;
  onAddVideo: (data: MediaSubmit) => void;
  busy?: boolean;
};

/**
 * "+ блок" bar with three explicit choices. HTML resolves inline (an empty
 * block, edited in place); image/video each open the upload dialog first,
 * since the file is required at creation (the API has no create-then-set-url
 * path). Three visible buttons beat a dropdown here — the options are few and
 * picking a media type immediately means picking a file.
 */
export function AddBlockMenu({
  onAddHtml,
  onAddImage,
  onAddVideo,
  busy,
}: AddBlockMenuProps) {
  const t = useTranslations('blog-admin');

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        {t('editor.addBlock')}
      </span>
      <Button variant="outline" size="sm" disabled={busy} onClick={onAddHtml}>
        <TypeIcon data-icon="inline-start" />
        {t('editor.blockType.html')}
      </Button>
      <MediaUploadDialog
        kind="image"
        requireFile
        maxBytes={BLOG_IMAGE_BLOCK_MAX_BYTES}
        busy={busy}
        onSubmit={onAddImage}
        trigger={
          <Button variant="outline" size="sm" disabled={busy}>
            <ImageIcon data-icon="inline-start" />
            {t('editor.blockType.image')}
          </Button>
        }
      />
      <MediaUploadDialog
        kind="video"
        requireFile
        maxBytes={BLOG_VIDEO_BLOCK_MAX_BYTES}
        busy={busy}
        onSubmit={onAddVideo}
        trigger={
          <Button variant="outline" size="sm" disabled={busy}>
            <VideoIcon data-icon="inline-start" />
            {t('editor.blockType.video')}
          </Button>
        }
      />
    </div>
  );
}
