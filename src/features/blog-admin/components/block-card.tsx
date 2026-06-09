'use client';

import { RefreshCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useDebouncedFlush } from '@/shared/hooks/use-debounced-flush';
import { Button } from '@/shared/ui/button';
import { EditorBlockShell } from '@/shared/ui/editor-block-shell';
import { InlineRichEditor } from '@/shared/ui/inline-rich-editor';

import {
  BLOG_BLOCK_CAPTION_MAX_LEN,
  BLOG_IMAGE_BLOCK_MAX_BYTES,
  BLOG_VIDEO_BLOCK_MAX_BYTES,
} from '../model/limits';
import type { BlogBlock } from '../model/types';
import { MediaUploadDialog, type MediaSubmit } from './media-upload-dialog';

type BlockCardProps = {
  block: BlogBlock;
  /** First row skips the top divider + top margin (passed to the shell). */
  isFirst: boolean;
  draggingActive: boolean;
  onUpdateHtml: (html: string) => void;
  onReplaceMedia: (data: MediaSubmit) => void;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
};

export function BlockCard({
  block,
  isFirst,
  draggingActive,
  onUpdateHtml,
  onReplaceMedia,
  onUpdateText,
  onDelete,
}: BlockCardProps) {
  const t = useTranslations('blog-admin');

  return (
    <EditorBlockShell
      id={block.id}
      isFirst={isFirst}
      onRemove={onDelete}
      dragLabel={t('editor.dragHandle')}
      deleteLabel={t('editor.deleteBlock')}
    >
      {block.type === 'html' ? (
        <HtmlBlockBody block={block} onUpdate={onUpdateHtml} />
      ) : (
        <MediaBlockBody
          block={block}
          draggingActive={draggingActive}
          onReplace={onReplaceMedia}
          onUpdateText={onUpdateText}
        />
      )}
    </EditorBlockShell>
  );
}

function HtmlBlockBody({
  block,
  onUpdate,
}: {
  block: Extract<BlogBlock, { type: 'html' }>;
  onUpdate: (html: string) => void;
}) {
  const t = useTranslations('blog-admin');
  // Debounced flush so we don't fire a PATCH on every keystroke; pending
  // edits are committed on unmount so the last keystroke is never lost.
  const { schedule } = useDebouncedFlush({
    serverValue: block.html,
    onChange: onUpdate,
    delayMs: 600,
  });

  return (
    <InlineRichEditor
      value={block.html}
      onChange={schedule}
      placeholder={t('editor.htmlPlaceholder')}
      emptyText={t('editor.htmlEmpty')}
    />
  );
}

function MediaBlockBody({
  block,
  draggingActive,
  onReplace,
  onUpdateText,
}: {
  block: Extract<BlogBlock, { type: 'image' | 'video' }>;
  draggingActive: boolean;
  onReplace: (data: MediaSubmit) => void;
  onUpdateText: (text: string) => void;
}) {
  const t = useTranslations('blog-admin');
  const text = block.type === 'image' ? block.caption : block.title;
  const maxBytes =
    block.type === 'image'
      ? BLOG_IMAGE_BLOCK_MAX_BYTES
      : BLOG_VIDEO_BLOCK_MAX_BYTES;
  const { schedule: scheduleText } = useDebouncedFlush({
    serverValue: text ?? '',
    onChange: onUpdateText,
    delayMs: 700,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
        {block.file ? (
          block.type === 'image' ? (
            // Presigned S3 URL (expiring, off-domain) — next/image would need
            // per-host config and gives no benefit for admin-only previews.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.file.url}
              alt={text ?? ''}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <video
              src={block.file.url}
              controls={!draggingActive}
              className="aspect-video w-full bg-black"
            />
          )
        ) : (
          <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
            {t('editor.mediaMissing')}
          </div>
        )}
      </div>

      <input
        type="text"
        defaultValue={text ?? ''}
        maxLength={BLOG_BLOCK_CAPTION_MAX_LEN}
        onChange={(e) => scheduleText(e.target.value)}
        placeholder={t(`editor.${block.type}TextPlaceholder`)}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <MediaUploadDialog
        kind={block.type}
        requireFile={false}
        maxBytes={maxBytes}
        initialUrl={block.file?.url ?? null}
        initialText={text ?? ''}
        onSubmit={onReplace}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
          >
            <RefreshCwIcon data-icon="inline-start" />
            {t('editor.replaceMedia')}
          </Button>
        }
      />
    </div>
  );
}
